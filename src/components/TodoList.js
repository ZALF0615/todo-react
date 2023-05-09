/* 
  할 일 목록을 관리하고 렌더링하는 주요 컴포넌트입니다.
  상태 관리를 위해 `useState` 훅을 사용하여 할 일 목록과 입력값을 관리합니다.
  할 일 목록의 추가, 삭제, 완료 상태 변경 등의 기능을 구현하였습니다.
*/
import React, { useState, useEffect } from "react";
import { useSession, signOut} from "next-auth/react";
import { useRouter } from "next/router";

import TodoItem from "@/components/TodoItem";
import styles from "@/styles/TodoList.module.css";

// firebase 관련 모듈을 임포트
import{ db } from "@/firebase";
import{
  collection,
  query,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
}from "firebase/firestore"

// DB의 Todos 컬렉션를 참조하기 위한 변수

const todoCollection = collection(db, "todos");
const adminCollection = collection(db, "admin_ids");

// TodoList 컴포넌트를 정의합니다.
const TodoList = () => {
  // 상태를 관리하는 useState 훅을 사용하여 할 일 목록과 입력값을 초기화합니다.
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();

  const { data }=useSession();
  // DB에서 할 일 목록을 가져오는 함수
  const getTodos = async () => {
    // const q = query(todoCollection)
    // const q = query(collection(db, "todos"), where("user", "==", user.uid));
    // const q = query(todoCollection, orderBy("datetime", "asc"));
    if(!data?.user?.name) return;

    const q = query(
      todoCollection,
      isAdmin ? {} : where("userId", "==", data?.user?.id),
      orderBy("datetime", "asc")      
    );
    console.log("adminid = " + data?.user?.id);
    console.log("isAdmin = " + isAdmin);

    const results = await getDocs(q);

    // 가져온 결과에서 data를 newTodos 배열에 담음

    const newTodos = results.docs.map((doc) => ({
    id: doc.id,
    userId: doc.data().userId,
    username: doc.data().username,
    text: doc.data().text,
    completed: doc.data().completed,
    datetime: doc.data().datetime.toDate(),
    }));

    setTodos(newTodos);
  }

  const checkAdmin = async () => {
    if(!data?.user?.name) return;

    const q = query(adminCollection, where("userId", "==", data?.user?.id));
    const result = await getDocs(q);
    if(result.size > 0){
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    checkAdmin();
    getTodos();
  }, [data, isAdmin]);
  

  // addTodo 함수는 입력값을 이용하여 새로운 할 일을 목록에 추가하는 함수입니다.
  const addTodo = async () => {
    // 입력값이 비어있는 경우 함수를 종료합니다.
    if (input.trim() === "") return;
    // 기존 할 일 목록에 새로운 할 일을 추가하고, 입력값을 초기화합니다.
    // {
    //   id: 할일의 고유 id,
    //   text: 할일의 내용,
    //   completed: 완료 여부,
    // }
    // ...todos => {id: 1, text: "할일1", completed: false}, {id: 2, text: "할일2", completed: false}}, ..

    //DB에 저장할 일을 변수에 담고 DB로 넘기기

    const date = new Date();

    const docRef = await addDoc(todoCollection,{
      userId: data?.user?.id,
      username: data?.user?.name,
      text: input,
      completed: false,
      datetime: date // dateTime
    });

    // id를 DB id와 통일
    setTodos([...todos, { id: docRef.id, userId: data?.user?.id, username: data?.user?.name, datetime: date, text: input, completed: false }]);
    setInput("");
  };

  // toggleTodo 함수는 체크박스를 눌러 할 일의 완료 상태를 변경하는 함수입니다.
  const toggleTodo = (id) => {
    // 할 일 목록에서 해당 id를 가진 할 일의 완료 상태를 반전시킵니다.

    if(todos.find((todo) => todo.id == id).userId !== data?.user?.id) { // 자신이 등록한 할 일이 아니면 함수 종료
      alert("자신이 등록하지 않은 할 일은 수정 및 삭제할 수 없습니다.");
      return;
    }

    const newTodos = todos.map((todo)=>{
      if(todo.id === id){
        // 해당하는 id를 가진 일의 상태를 업데이트
        const todoDoc = doc(todoCollection, id);
        updateDoc(todoDoc, {completed: !todo.completed});
        return {...todo, completed: !todo.completed };
      }else{
        return todo;
      }
      
    });
    
    // 변경한 newTodos를 set
    setTodos(newTodos);
  };

  // deleteTodo 함수는 할 일을 목록에서 삭제하는 함수입니다.
  const deleteTodo = (id) => {
    // 해당 id를 가진 할 일을 제외한 나머지 목록을 새로운 상태로 저장합니다.
    if(todos.find((todo) => todo.id == id).userId !== data?.user?.id) { // 자신이 등록한 할 일이 아니면 함수 종료
      
      alert("자신이 등록하지 않은 할 일은 수정 및 삭제할 수 없습니다.");
      return;
    }
    const todoDoc = doc(todoCollection, id);
    deleteDoc(todoDoc);

    // setTodos(todos.filter((todo) => todo.id !== id));
    setTodos(
      todos.filter((todo) => {
        return todo.id !== id;
      })
    );
  };

  // upperTodo 함수는 할 일을 목록에서 하나 더 높은 위치로 이동시키는 함수입니다.
  const upperTodo = (id) => {
    const index = todos.findIndex((todo) => todo.id === id);
  
    if (index === 0) return;
  
    const task = todos[index];
    const newTodos = [...todos.slice(0, index), ...todos.slice(index + 1)];

    newTodos.splice(index - 1, 0, task);
    setTodos(newTodos);
  };

  const lowerTodo = (id) => {
    const index = todos.findIndex((todo) => todo.id === id);
  
    if (index === todos.length - 1) return;
  
    const task = todos[index];
    const newTodos = [...todos.slice(0, index), ...todos.slice(index + 1)];

    newTodos.splice(index + 1, 0, task);
    setTodos(newTodos);
  };
  // 컴포넌트를 렌더링합니다.
  return (
    <div className={styles.container}>
      {/* 로그아웃 버튼 추가 */}
      <button
        onClick={() => {
          signOut();
          router.push('/auth/signin');
        }}
        className="absolute top-4 left-4 px-3 py-1 bg-white text-blue-500 border border-blue-500 rounded hover:bg-blue-500 hover:text-white">
        Sign Out
      </button>
      <h1 className="text-xl mb-4 font-bold underline underline-offset-4 decoration-wavy">
        {data?.user?.name}'s Todo List
      </h1>
      {/* 할 일을 입력받는 텍스트 필드입니다. */}
      <input
        type="text"
        // className={styles.itemInput}
        // -- itemInput CSS code --
        // input[type="text"].itemInput {
        //   width: 100%;
        //   padding: 5px;
        //   margin-bottom: 10px;
        // }
        className="shadow-lg w-full p-1 mb-4 border border-gray-300 rounded"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {/* 할 일을 추가하는 버튼입니다. */}
      <div class="grid">
        <button
          // className={styles.addButton}
          // -- addButton CSS code --
          // button.addButton {
          //   padding: 5px;
          //   background-color: #0070f3;
          //   color: white;
          //   border: 1px solid #0070f3;
          //   border-radius: 5px;
          //   cursor: pointer;
          // }
          //
          // button.addButton:hover {
          //   background-color: #fff;
          //   color: #0070f3;
          // }
          className="shadow-lg w-40 justify-self-end p-1 mb-4 bg-blue-500 text-white border border-blue-500 rounded hover:bg-white hover:text-blue-500"
          onClick={addTodo}
        >
          Add Todo
        </button>
      </div>
      {/* 할 일 목록을 렌더링합니다. */}
      <ul>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            isAdmin={isAdmin}
            todo={todo}
            onToggle={() => toggleTodo(todo.id)}
            onDelete={() => deleteTodo(todo.id)}
            onUpper ={() => upperTodo(todo.id)}
            onLower ={() => lowerTodo(todo.id)}
          />
        ))}
      </ul>
      <span className="absolute bottom-4 right-4 px-3 py-1">
        {isAdmin ? "Admin mode" : ""}
      </span>
    </div>
  );
};

export default TodoList;
