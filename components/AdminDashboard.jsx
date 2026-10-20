import {
  LayoutDashboard,
  Utensils,
  Users,
  CalendarCheck,
  Settings,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, active: true },
  { icon: Utensils },
  { icon: Users },
  { icon: CalendarCheck },
  { icon: Settings },
];

const stats = [
  { label: "Orders", value: "12.8k" },
  { label: "Revenue", value: "48.2k" },
  { label: "Workers", value: "156" },
  { label: "Hotels", value: "42" },
];

const orders = [
  { id: "#1001", customer: "Ahmed K.", total: "450", status: "Done" },
  { id: "#1002", customer: "Fatima N.", total: "620", status: "Prep" },
];

const statusColor = {
  Done: "bg-green-500/20 text-green-400",
  Prep: "bg-amber-500/20 text-amber-400",
};

export default function AdminDashboard() {
  return (
    <div className="flex h-full w-full bg-[#0a0a0f] text-white overflow-hidden select-none">
      {/* Sidebar – icons only */}
      <aside className="w-9 shrink-0 bg-gradient-to-b from-[#0B1220] to-[#1a1a2e] border-r border-white/5 flex flex-col items-center py-2 gap-1">
        <div className="w-5 h-5 rounded bg-[#C9A227]/20 text-[#C9A227] font-serif font-bold text-[10px] flex items-center justify-center mb-1">
          M
        </div>
        {navItems.map(({ icon: Icon, active }, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded flex items-center justify-center ${
              active ? "bg-[#C9A227]/20 text-[#C9A227]" : "text-white/30"
            }`}
          >
            <Icon size={11} />
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 p-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-white/80">
            Dashboard
          </span>
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-green-400" />
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="w-1 h-1 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1 mb-1.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/5 rounded p-1"
            >
              <p className="text-[7px] text-white/40 leading-none mb-0.5">
                {s.label}
              </p>
              <p className="text-[10px] font-bold leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div className="bg-white/5 border border-white/5 rounded p-1.5">
          <p className="text-[8px] text-white/50 mb-1">Recent Orders</p>
          <div className="space-y-1">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center gap-1 text-[8px]">
                <span className="font-mono text-white/40 w-8">{o.id}</span>
                <span className="text-white/70 flex-1 truncate">
                  {o.customer}
                </span>
                <span className="text-white/50">{o.total}</span>
                <span
                  className={`px-1 rounded-full text-[6px] font-medium ${statusColor[o.status]}`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
