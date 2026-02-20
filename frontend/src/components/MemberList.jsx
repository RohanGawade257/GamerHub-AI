import { Link } from "react-router-dom";

function getMemberId(member) {
  if (!member) {
    return "";
  }
  if (typeof member === "string") {
    return member;
  }
  return String(member._id || member.id || "");
}

function MemberList({ members, onlineUsers = new Set() }) {
  return (
    <section className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/85">
      <h2 className="text-lg font-bold">Members</h2>

      <ul className="mt-3 space-y-2">
        {members.map((member) => {
          const memberId = getMemberId(member);
          const isOnline = onlineUsers.has(String(memberId));

          return (
            <li
              key={memberId}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/75 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800/80"
            >
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                <Link
                  to={`/player/${memberId}`}
                  className="font-semibold transition-colors hover:text-cyan-600 hover:underline dark:hover:text-cyan-300"
                >
                  {member.name || "Unknown player"}
                </Link>
              </div>

              <span className="text-sm text-gray-600 dark:text-gray-300">
                Skill {member.skillLevel || 1}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default MemberList;
