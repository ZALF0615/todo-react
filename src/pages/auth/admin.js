import { useRouter } from "next/router";
import { useState } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import { useSession } from "next-auth/react";

// firebase 관련 모듈을 임포트
import{ db } from "@/firebase";
import{
  collection,
  query,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
}from "firebase/firestore"

const adminCollection = collection(db, "admin_ids");

const SECRET_PASSWORD = "pw_test"; // 지정된 비밀번호를 설정합니다.

export default function Admin() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const { data } = useSession();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 입력된 비밀번호가 지정된 비밀번호와 일치하는지 확인합니다.
    if (password === SECRET_PASSWORD) {
        // Firestore에서 userId가 일치하는 문서를 검색합니다.
        const snapshot = await getDocs(query(adminCollection, where("userId", "==", data?.user?.id)));
      
        // 검색 결과 문서의 개수가 0보다 큰 경우 이미 등록된 userId가 있으므로 에러 메시지를 표시합니다.
        if (snapshot.size > 0) {
          alert("This userId is already registered.");
        } else {
          // 검색 결과 문서의 개수가 0인 경우 새로운 문서를 추가합니다.
          await addDoc(adminCollection, { userId: data?.user?.id });
          alert("admin registered");
          router.push("/");
        }
      } else {
        // 일치하지 않으면, 에러 메시지를 표시하거나 다른 처리를 할 수 있습니다.
        alert("Invalid password");
      }
    }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <button
        onClick={() => {
            router.push('/auth/signin');
        }}
        className="absolute top-4 left-4 px-3 py-1 bg-white text-blue-500 border border-blue-500 rounded hover:bg-blue-500 hover:text-white">
        Back
      </button>
      <h1 className="text-3xl mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit} className="w-64">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded"
          placeholder="Enter admin password : pw_test"
        />
        <button
          type="submit"
          className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
}