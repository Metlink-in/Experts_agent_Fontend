import React, { useState } from "react";

export default function ChatWidget({ askAI }) {

  const [messages,setMessages] = useState([
    {role:"bot",text:"👋 Welcome! How can we help you explore AI for your business today?"}
  ])

  const [input,setInput] = useState("")

  const send = async ()=>{

    if(!input) return

    const userMsg={role:"user",text:input}

    setMessages(m=>[...m,userMsg])

    const reply = await askAI(input)

    setMessages(m=>[...m,userMsg,{role:"bot",text:reply}])

    setInput("")
  }

  return(

    <div className="chat-container">

      <div className="chat-header">
        ✨ Trinity Agents
      </div>

      <div className="chat-body">

        {messages.map((m,i)=>(
          <div key={i} className={m.role}>
            {m.text}
          </div>
        ))}

      </div>

      <div className="chat-input">

        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="Type message..."
        />

        <button onClick={send}>➤</button>

      </div>

    </div>

  )
}