import React, { useEffect, useRef, useState } from "react";
import logo from "../../assets/logo.png";
import { FiPhoneOutgoing } from "react-icons/fi";
import Input from "../../Components/Input/Input";
import { LuSend } from "react-icons/lu";
import { IoIosAddCircleOutline } from "react-icons/io";
import { io } from "socket.io-client";
import { LuPanelLeftOpen } from "react-icons/lu";
import { LuPanelRightOpen } from "react-icons/lu";
import cors from "cors";

const Dashboard = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const messageRef = useRef(null);
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  useEffect(() => {
    // const socket = io("https://engage-omega.vercel.app",{
    //   withCredentials:true,
    //   cors:{
    //     origin: 'https://engage-chat.vercel.app/',
    //     methods: ['GET', 'POST']
    //   },
    //   transports:["websocket","polling"],
    //   forceNew:true
    // });

    // socket.on("connect", () => {
    //   console.log("Connected to Socket.IO");
    // });

    // socket.on("connect_error", (err) => {
    //   console.error("Socket.IO connection error:", err);
    // });

    setSocket(io("https://engage-omega.vercel.app"),{
      transports:["websockets","polling"]
    });
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
    if (messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [messages?.messages]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const fetchConversations = async () => {
      const res = await fetch(
        `https://engage-omega.vercel.app/api/conversation/${loggedInUser?.id}`,
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
      const res = await fetch(`https://engage-omega.vercel.app/api/users/${user?.id}`, {
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
      `https://engage-omega.vercel.app/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
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
    await fetch(`https://engage-omega.vercel.app/api/message`, {
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

  const handleLogout = async () => {
    try {
      // Assuming you have user stored in state
      const userId = user?.id;

      const response = await fetch("https://engage-omega.vercel.app/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Clear user data from local storage
        localStorage.removeItem("user:detail");
        localStorage.removeItem("user:token");

        // Redirect to login or home page
        // You may use React Router or any other navigation method
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  return (
    <div className="w-screen h-screen flex flex-row no-scrollbar">
      {/* large screen div */}
      <div className="w-[25%] h-full bg-secondary overflow-scroll no-scrollbar lg:block hidden">
        <div className="flex justify-between px-5">
          <div className="text-blue-400 flex text-2xl font-semibold cursor-pointer pt-4">
            <img src="logo.png" alt="Engage" width={40} height={10} />
            <h1 className="pt-1">Engage</h1>
          </div>
          <div className="text-white font-semibold cursor-pointer pt-5 text-xl">
            <h1 onClick={handleLogout} className="bg-blue-400 p-1 rounded-2xl">
              Logout
            </h1>
          </div>
        </div>
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
      {/* md and sm screen div */}
      {show1 && (
        <div className="w-screen z-50 h-screen fixed bg-secondary overflow-scroll no-scrollbar lg:hidden block">
          <div className="pl-6 pt-3" onClick={() => setShow1(false)}>
            <LuPanelRightOpen size={23} />
          </div>
          <div className="flex justify-between px-5">
            <div className="text-blue-400 flex text-lg font-semibold cursor-pointer pt-4">
              <img src="logo.png" alt="Engage" width={40} height={10} />
              <h1 className="pt-1">Engage</h1>
            </div>
            <div className="text-white font-semibold cursor-pointer pt-4 text-lg">
              <h1
                onClick={handleLogout}
                className="bg-blue-400 p-1 rounded-2xl"
              >
                Logout
              </h1>
            </div>
          </div>
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
      )}
      {/* large screen div */}
      <div className="w-[50%] lg:block items-center hidden relative h-full overflow-hidden bg-white flex-col px-4 pt-10">
        {messages?.receiver?.fullName && (
          <div className="w-[100%] bg-secondary h-[15%] rounded-full flex items-center px-10 justify-between py-2">
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
            {/* <div className="cursor-pointer">
                <FiPhoneOutgoing />
              </div> */}
          </div>
        )}
        <div
          className="h-[70%] overflow-scroll no-scrollbar  w-full shadow-sm"
          ref={messageRef}
        >
          <div className="p-5">
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } = {} }, index) => {
                return (
                  <>
                    <div
                      ref={messageRef}
                      className={`max-w-[50%] rounded-b-lg p-4 mb-7 ${
                        id === user?.id
                          ? "bg-primary rounded-tl-lg ml-auto text-white"
                          : "bg-secondary rounded-tr-lg"
                      }`}
                    >
                      {message}
                    </div>
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
          <div className="p-14  w-[100%] flex items-center h-[15%]">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full"
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
            {/* <div
                className={`p-4 cursor-pointer flex bg-light rounded-full ${
                  !message && "pointer-events-none"
                }`}
              >
                <IoIosAddCircleOutline size={25} />
              </div> */}
          </div>
        )}
      </div>
      {/* md and sm screen div */}
      <div className="w-screen lg:hidden items-center block relative h-full overflow-hidden bg-white flex-col px-4 pt-8 pb-10">
        <div className="flex justify-between">
          <div className="lg:hidden" onClick={() => setShow1(true)}>
            <LuPanelLeftOpen size={23} color="blue" />
          </div>
          <div className="lg:hidden" onClick={() => setShow2(true)}>
            <LuPanelRightOpen size={23} color="blue" />
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="w-[100%] bg-secondary h-[15%] rounded-full flex items-center px-10 justify-between py-5">
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
            {/* <div className="cursor-pointer">
                <FiPhoneOutgoing />
              </div> */}
          </div>
        )}
        <div
          className="h-[70%] overflow-scroll no-scrollbar  w-full shadow-sm"
          ref={messageRef}
        >
          <div className="p-5">
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } = {} }, index) => {
                return (
                  <>
                    <div
                      key={index}
                      className={`max-w-[50%] rounded-b-lg p-4 mb-7 ${
                        id === user?.id
                          ? "bg-primary rounded-tl-lg ml-auto text-white"
                          : "bg-secondary rounded-tr-lg"
                      }`}
                    >
                      {message}
                    </div>
                  </>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold py-60">
                No Messages or No Conversations Selected
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-14  w-[100%] flex items-center h-[15%]">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full"
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
            {/* <div
                className={`p-4 cursor-pointer flex bg-light rounded-full ${
                  !message && "pointer-events-none"
                }`}
              >
                <IoIosAddCircleOutline size={25} />
              </div> */}
          </div>
        )}
      </div>
      {/* Large screen div */}
      <div className="w-[25%] h-full lg:block hidden bg-light px-8 top-0 overflow-scroll no-scrollbar pt-3">
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
      {/* md and sm screen div */}
      {show2 && (
        <div className="w-screen z-50 h-screen fixed lg:hidden block bg-light px-8 top-0 overflow-scroll no-scrollbar pt-3">
          <div className="lg:hidden pl-72" onClick={() => setShow2(false)}>
            <LuPanelLeftOpen size={23} />
          </div>
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
      )}
    </div>
  );
};

export default Dashboard;
