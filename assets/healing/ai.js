// ai.js — capa AI (conversación real contra tu backend)
// NOTA: API key jamás en el navegador. Este archivo solo llama a TU endpoint.

export function createAIClient(opts){
  const { endpoint, debug = false } = opts;
  let previousResponseId = null;

  function getSessionId(){
    try{
      let sid = localStorage.getItem("hs_sid");
      if(!sid){
        sid = crypto.randomUUID();
        localStorage.setItem("hs_sid", sid);
      }
      return sid;
    }catch{
      return null;
    }
  }

async function replyStreaming({ message, onTypingDone, onDelta, onFinal, meta }){
    const res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      mode: "cors",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream, application/json, text/plain"
      },
      body: JSON.stringify({
        message,
        meta: {
          session_id: getSessionId(),
          ...(meta || {})
        },
        previous_response_id: previousResponseId
      })
    });

    if(!res.ok){
      const txt = await res.text().catch(()=> "");
      throw new Error(`IA backend no respondió (${res.status}). ${txt.slice(0,120)}`);
    }

    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    if(debug) console.log("[AI] content-type:", ctype);

    if(ctype.includes("application/json")){
      const data = await res.json().catch(()=> ({}));
      const text = (data.note ?? data.text ?? data.reply ?? data.message ?? "").toString();
      onTypingDone?.();
      onFinal?.(text || "…");

      if(data.response_id) previousResponseId = data.response_id;
      if(data.id && !previousResponseId) previousResponseId = data.id;
      return;
    }

    if(!res.body) throw new Error("Respuesta sin body (stream no disponible).");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let gotAnyDelta = false;

    while(true){
      const { value, done } = await reader.read();
      if(done) break;
      buffer += decoder.decode(value, { stream:true });

      let idx;
      while((idx = buffer.indexOf("\n\n")) !== -1){
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        for(const line of chunk.split("\n")){
          if(!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if(!raw || raw === "[DONE]") continue;

          try{
            const evt = JSON.parse(raw);
            if(evt.type === "delta"){
              if(!gotAnyDelta){
                gotAnyDelta = true;
                onTypingDone?.();
              }
              onDelta?.(evt.delta || "");
            }else if(evt.type === "done"){
              previousResponseId = evt.response_id || previousResponseId;
            }
          }catch{
            if(!gotAnyDelta){
              gotAnyDelta = true;
              onTypingDone?.();
            }
            onDelta?.(raw);
          }
        }
      }
    }

    if(!gotAnyDelta){
      onTypingDone?.();
      onFinal?.("…");
    }
  }

  return { replyStreaming };
}
