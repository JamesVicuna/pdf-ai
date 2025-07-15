type MessageProps = {
  message: string;
  position: "start" | "end";
};

export const MessageBubble = ({ message, position }: MessageProps) => {
  return (
    <>
      <div className={`chat chat-${position}`}>
        <div className="chat-bubble">{message}</div>
      </div>
    </>
  );
};
