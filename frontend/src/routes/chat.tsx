import React, { useState, useEffect, KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "aws-amplify";
import { Conversation } from "../common/types";
import ChatSidebar from "../components/ChatSidebar";
import ChatMessages from "../components/ChatMessages";
import LoadingGrid from "../../public/loading-grid.svg";
 
const Document: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  // console.log("params", params)
 
  const [conversation, setConversation] = useState < Conversation | null > (null);
  const [loading, setLoading] = React.useState < string > ("idle");
  const [messageStatus, setMessageStatus] = useState < string > ("idle");
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [conversationListStatus, setConversationListStatus] = useState <
    "idle" | "loading"
    > ("idle");
  const [prompt, setPrompt] = useState("");
  const [model_id, setModelId] = useState("anthropic.claude-v2:1");  
 
  const fetchData = async (conversationid = params.conversationid) => {
    setLoading("loading");
    const conversation = await API.get(
      "serverless-pdf-chat",
      `/doc/${params.documentid}/${conversationid}`,
      {}
    );
    setConversation(conversation);
    setLoading("idle");
  };
 
  useEffect(() => {
    fetchData();
  }, []);
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };
  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(event.target.value);
  };
  const handleModelIdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelId(event.target.value);  // Update model ID state
  };
 
 
  const addConversation = async () => {
    setConversationListStatus("loading");
    const newConversation = await API.post(
      "serverless-pdf-chat",
      `/doc/${params.documentid}`,
      {}
    );
    fetchData(newConversation.conversationid);
    navigate(`/doc/${params.documentid}/${newConversation.conversationid}`);
    setConversationListStatus("idle");
  };
 
  const switchConversation = (e: React.MouseEvent<HTMLButtonElement>) => {
    const targetButton = e.target as HTMLButtonElement;
    navigate(`/doc/${params.documentid}/${targetButton.id}`);
    fetchData(targetButton.id);
  };
 
  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key == "Enter") {
      submitMessage();
    }
  };
 
  const submitMessage = async () => {
    setMessageStatus("loading");
 
    if (conversation !== null) {
      const previewMessage = {
        type: "text",
        data: {
          content: prompt,
          additional_kwargs: {},
          example: false,
        },
      };
 
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, previewMessage],
      };
 
      setConversation(updatedConversation);
    }
 
    await API.post(
      "serverless-pdf-chat",
      `/${conversation?.document.documentid}/${conversation?.conversationid}`,
      {
        body: {
          fileName: conversation?.document.filename,
          prompt: prompt,
          language: selectedLanguage,
          model_id: model_id,
        },
      }
    );
    setPrompt("");
    fetchData(conversation?.conversationid);
    setMessageStatus("idle");
  };
 
  const handleDeleteChatHistory = async () => {
    console.log("func called")
    alert("do you want to delet your chat history")
    const deletHistory = async (conversationid = params.conversationid) => {
      // console.log("conversation id inside", conversationid)
      try {
        const response = await API.del(
          'serverless-pdf-chat',
          '/Delete_History',
          {
            body: {
              conversation_ids: [params.conversationid],
            },
          }
        );
        console.log('Delete request successful', response);
        fetchData();
      } catch (error) {
        console.error('Error during delete request:', error);
      }
    };
    deletHistory();
  };
 
  return (
    <div className="">
      {loading === "loading" && !conversation && (
        <div className="flex flex-col items-center mt-6">
          <img src={LoadingGrid} width={40} />
        </div>
      )}
      {conversation && (
        <div className="grid grid-cols-12 border border-gray-200 rounded-lg">
          <ChatSidebar
            conversation={conversation}
            params={params}
            addConversation={addConversation}
            switchConversation={switchConversation}
            conversationListStatus={conversationListStatus}
            selectedLanguage={selectedLanguage}
            handleDeleteChatHistory={handleDeleteChatHistory}
            onLanguageChange={handleLanguageChange}
          />
          <ChatMessages
            prompt={prompt}
            model_id={model_id}
            conversation={conversation}
            messageStatus={messageStatus}
            submitMessage={submitMessage}
            handleKeyPress={handleKeyPress}
            selectedLanguage={selectedLanguage}
            handlePromptChange={handlePromptChange}
            handleModelIdChange={handleModelIdChange}
          />
        </div>
      )}
    </div>
  );
};
 
export default Document;