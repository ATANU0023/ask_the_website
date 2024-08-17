import { ChatWrapper } from "@/components/ChatWrapper";
import { ragChat } from "@/lib/rag-chat"
import { redis } from "@/lib/redis";
import { cookies } from "next/headers";

interface PageProps {
    params: {
        url: string | string[] | undefined
    }
}


const reconstructUrl = ({url}: {url: string[]}) => {
    const decodedComponents = url.map((component)=> decodeURIComponent(component));

    return decodedComponents.join("/");
}

const Page = async({params}: PageProps)=>{

    const sessionCookie = cookies().get("sessionId")?.value
    const reconstructedUrl = reconstructUrl({url: params.url as string[]});

    const sessionId = (reconstructUrl + "--" + sessionCookie).replace(/\//g,"")

    const isAlreadyIndexed = await redis.sismember("indexed-urls", reconstructedUrl);

    // console.log("isAlreadyIndexed",isAlreadyIndexed);

    const initialMessages = await ragChat.history.getMessages({amount: 20,sessionId})

    if(!isAlreadyIndexed){
        await ragChat.context.add({
            type: "html",
            source: reconstructedUrl,
            config: {chunkOverlap: 50, chunkSize: 300},
        });

        await redis.sadd("indexed-urls", reconstructedUrl);
    }

    
   

    return <ChatWrapper 
    sessionId={sessionId}
    initialMessages={initialMessages} />
}

export default Page;