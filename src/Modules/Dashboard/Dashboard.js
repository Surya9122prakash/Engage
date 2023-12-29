import React, { useEffect, useRef, useState } from "react";
import logo from "../../assets/logo.png";
import { FiPhoneOutgoing } from "react-icons/fi";
import Input from "../../Components/Input/Input";
import { LuSend } from "react-icons/lu";
import { IoIosAddCircleOutline } from "react-icons/io";
import { io } from "socket.io-client";

const Dashboard = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const messageRef = useRef();

  useEffect(() => {
    const socket = io("http://localhost:8000",{
      transports: ['websocket'], 
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
    });

    setSocket(socket);
  }, []);

  useEffect(() => {
    socket?.emit("addUser", user?.id);
    socket?.on("getUsers", (users) => {
      console.log("activeUsers:>>", users);
    });

    // socket?.on("getMessage", (data) => {
    //   setMessages((prev) => ({
    //     ...prev,
    //     messages: [
    //       ...prev.messages,
    //       { user: data.user, message: data.message },
    //     ],
    //   }));
    // });
    socket?.on("getMessage", (data) => {
      setMessages((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { user: data.user, message: data.message },
        ],
      }));
    });
  }, [socket]);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.messages]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const fetchConversations = async () => {
      const res = await fetch(
        `http://localhost:8000/api/conversation/${loggedInUser?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const resData = await res.json();
      console.log("resData :>> ", resData);
      setConversations(resData);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resData = await res.json();
      setUsers(resData);
    };    
    fetchUsers();
  }, [users]);

  const fetchMessages = async (conversationId, receiver) => {
    const res = await fetch(
      `http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }

    const resData = await res.json();
    setMessages({ messages: resData, receiver, conversationId });
  };

  const sendMessage = async (e) => {
    if (!socket) return;
    socket?.emit("sendMessage", {
      senderId: user?.id,
      receiverId: messages?.receiver?.receiverId,
      message,
      conversationId: messages?.conversationId,
    });
    const res = await fetch(`http://localhost:8000/api/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: messages?.conversationId,
        senderId: user?.id,
        message,
        receiverId: messages?.receiver?.receiverId,
      }),
    });
    setMessage("");
  };
  return (
    <div className="w-screen flex flex-row">
      <div className="w-[25%] h-screen bg-secondary overflow-scroll no-scrollbar">
        <div className="flex mx-10 items-center my-8">
          <div className="border border-primary p-2 rounded-full">
            <img src={logo} alt="logo" width={75} height={75} />
          </div>
          <div className="ml-3">
            <h3 className="text-2xl capitalize">{user?.fullName}</h3>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />
        <div className="mx-10 mt-10">
          <div className="text-primary text-lg">Messages</div>
          <div> 
            {conversations.length > 0 ? (
              conversations.map(({ conversationId, user }) => {
                return (
                  <div className="flex items-center py-3 border-b border-b-gray-300">
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => {
                        fetchMessages(conversationId, user);
                      }}
                    >
                      <div>
                        <img src={logo} alt="logo" width={60} height={60} />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold capitalize">
                          {user?.fullName}
                        </h3>
                        <p className="text-sm font-light text-gray-600">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-20 text-black">
                <h3>No Conversations</h3>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[50%] h-screen bg-white flex flex-col items-center">
        {messages?.receiver?.fullName && (
          <div className="w-[75%] bg-secondary h-[80px] mt-10 rounded-full flex items-center px-10 justify-between py-2">
            <div className="flex">
              <div className="cursor-pointer">
                <img src={logo} alt="logo" width={60} height={60} />
              </div>
              <div className="ml-3 pt-1">
                <h3 className="text-lg capitalize">
                  {messages?.receiver?.fullName}
                </h3>
                <p className="text-sm font-light text-gray-600">
                  {messages?.receiver?.email}
                </p>
              </div>
            </div>
            <div className="cursor-pointer">
              <FiPhoneOutgoing />
            </div>
          </div>
        )}
        <div className="h-[60%] w-full overflow-scroll no-scrollbar shadow-sm">
          <div className="p-14">
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } = {} }) => {
                return (
                  <>
                    <div
                      className={`max-w-[50%] rounded-b-lg p-4 mb-7 ${
                        id === user?.id
                          ? "bg-primary rounded-tl-lg ml-auto text-white"
                          : "bg-secondary rounded-tr-lg"
                      }`}
                    >
                      {message}
                    </div>
                    <div ref={messageRef}></div>
                  </>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Messages or No Conversations Selected
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-14 w-full flex items-center">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-[75%]"
              type="text"
              inputClassName="p-4 border-0 shadow-lg bg-light rounded-3xl focus:ring-0 focus:border-0 outline-none"
            />
            <div
              className={`p-4 cursor-pointer flex bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
            >
              <LuSend size={25} />
            </div>
            <div
              className={`p-4 cursor-pointer flex bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
            >
              <IoIosAddCircleOutline size={25} />
            </div>
          </div>
        )}
      </div>
      <div className="w-[25%] h-screen bg-light px-8 py-16 overflow-scroll no-scrollbar">
        <div className="text-primary text-lg">People</div>
        <div>
          {users.length > 0 ? (
            users.map(({ userId, user }) => {
              return (
                <div className="flex items-center py-3 border-b border-b-gray-300">
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => {
                      fetchMessages("new", user);
                    }}
                  >
                    <div>
                      <img src={logo} alt="logo" width={60} height={60} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold capitalize">
                        {user?.fullName}
                      </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-20 text-black">
              <h3>No Conversations</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
