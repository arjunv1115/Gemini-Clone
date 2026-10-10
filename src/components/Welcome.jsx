import Icon from "./Icon";

const SUGGESTIONS = [
  { text: "Suggest beautiful places to see on an upcoming road trip", icon: "compass_icon" },
  { text: "Briefly summarize this concept: urban planning", icon: "bulb_icon" },
  { text: "Brainstorm team bonding activities for our work retreat", icon: "message_icon" },
  { text: "Improve the readability of the following code", icon: "code_icon" },
];

export default function Welcome({ onPick }) {
  return (
    <div className="welcome">
      <h1 className="greeting">
        <span className="gradient-text">Hello there.</span>
        <span className="greeting-sub">How can I help you today?</span>
      </h1>
      <div className="cards">
        {SUGGESTIONS.map((s) => (
          <button key={s.text} className="card" onClick={() => onPick(s.text)}>
            <p>{s.text}</p>
            <Icon name={s.icon} size={34} className="card-icon" />
          </button>
        ))}
      </div>
    </div>
  );
}
