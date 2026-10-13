"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Utensils,
  Users,
  CalendarCheck,
  DollarSign,
  Hotel,
  Building2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
  { icon: Utensils, label: "Menu", key: "menu" },
  { icon: Users, label: "Workers", key: "workers" },
  { icon: CalendarCheck, label: "Attendance", key: "attendance" },

  { icon: Settings, label: "Settings", key: "settings" },
];

export default function AdminDashboard({ compact = false }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(compact); // collapsed by default in compact mode

  // Dummy stats
  const stats = [
    { label: "Orders", value: "12,847", change: "+12%" },
    { label: "Revenue", value: "₿48.2k", change: "+8%" },
    { label: "Workers", value: "156", change: "+5%" },
    { label: "Hotels", value: "42", change: "+2%" },
  ];

  const recentOrders = [
    {
      id: "#1001",
      customer: "Ahmed K.",
      items: "Pizza, Soda",
      total: "450",
      status: "Completed",
    },
    {
      id: "#1002",
      customer: "Fatima N.",
      items: "Chicken, Rice",
      total: "620",
      status: "Preparing",
    },
    {
      id: "#1003",
      customer: "Ali R.",
      items: "Soup, Salad",
      total: "320",
      status: "Pending",
    },
  ];

  const getStatusColor = (status) => {
    if (status === "Completed") return "bg-green-500/20 text-green-400";
    if (status === "Preparing") return "bg-amber-500/20 text-amber-400";
    return "bg-blue-500/20 text-blue-400";
  };

  const sidebarWidth = compact
    ? sidebarCollapsed
      ? "w-10"
      : "w-40"
    : sidebarCollapsed
      ? "w-16"
      : "w-56";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div
      className={`flex bg-[#0a0a0f] text-white ${compact ? "min-h-[250px]" : "min-h-[450px]"}`}
    >
      {/* Sidebar (collapsed by default in compact) */}
      <aside
        className={`
          shrink-0 bg-gradient-to-b from-[#0B1220] to-[#1a1a2e] border-r border-white/5
          transition-all duration-300 overflow-hidden
          ${sidebarWidth}
        `}
      >
        <div
          className={`flex items-center gap-2 px-2 py-2 border-b border-white/5 ${sidebarCollapsed ? "justify-center" : ""}`}
        >
          <span
            className={`font-serif text-[#C9A227] font-bold ${compact ? "text-lg" : "text-2xl"}`}
          >
            {sidebarCollapsed ? "S" : "Melmah"}
          </span>
          {!sidebarCollapsed && !compact && (
            <span className="text-xs text-white/40">Admin</span>
          )}
        </div>
        <nav className="py-2 px-1 space-y-1">
          {navItems.map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition
                ${activeTab === key ? "bg-[#C9A227]/20 text-[#C9A227]" : "text-white/50 hover:text-white hover:bg-white/5"}
                ${sidebarCollapsed ? "justify-center" : ""}
                ${compact ? "text-[10px]" : "text-sm"}
              `}
            >
              <Icon size={compact ? 14 : 18} className="shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium truncate">
                  {compact ? label.slice(0, 4) : label}
                </span>
              )}
              {activeTab === key && !sidebarCollapsed && (
                <span className="ml-auto w-1 h-1 rounded-full bg-[#C9A227]" />
              )}
            </button>
          ))}
        </nav>
        {!compact && (
          <div className="border-t border-white/5 p-3">
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full bg-[#C9A227]/30 flex items-center justify-center text-[#C9A227] font-bold text-sm">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Admin User</p>
                <p className="text-[10px] text-white/40 truncate">
                  admin@Melmah.com
                </p>
              </div>
              <LogOut
                size={14}
                className="text-white/30 hover:text-white/60 cursor-pointer"
              />
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex justify-center text-white/30 hover:text-white/60 transition mt-2"
            >
              {sidebarCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 p-2 md:p-3 overflow-y-auto ${compact ? "max-h-[350px]" : "max-h-[600px]"}`}
      >
        {/* Top bar – simplified in compact */}
        <div
          className={`flex items-center justify-between mb-2 ${compact ? "text-xs" : "text-sm"}`}
        >
          <h1
            className={`font-semibold capitalize ${compact ? "text-xs" : "text-lg"}`}
          >
            {activeTab}
          </h1>
          {!compact && (
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search
                  size={14}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/40 w-32"
                />
              </div>
              <Bell
                size={16}
                className="text-white/50 hover:text-white/80 cursor-pointer"
              />
              <div className="w-7 h-7 rounded-full bg-[#C9A227]/30 flex items-center justify-center text-[#C9A227] font-bold text-xs">
                A
              </div>
            </div>
          )}
        </div>

        {/* Stats – smaller cards in compact */}
        <div
          className={`grid ${compact ? "grid-cols-4" : "grid-cols-2 md:grid-cols-4"} gap-1.5 mb-2`}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`bg-white/5 rounded-lg border border-white/5 ${compact ? "p-1.5" : "p-3"}`}
            >
              <p
                className={`${compact ? "text-[8px]" : "text-xs"} text-white/40`}
              >
                {stat.label}
              </p>
              <p className={`${compact ? "text-sm" : "text-xl"} font-bold`}>
                {stat.value}
              </p>
              <span
                className={`${compact ? "text-[8px]" : "text-xs"} ${stat.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}
              >
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Quick actions (only shown in full mode) */}
        {!compact && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div className="md:col-span-2 bg-white/5 rounded-xl border border-white/5 p-3 flex items-center justify-center min-h-[80px]">
              <span className="text-white/30 text-sm">📊 Chart</span>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/5 p-3 space-y-1.5">
              <p className="text-xs font-medium text-white/70">Quick Actions</p>
              <button className="w-full flex items-center gap-1.5 bg-[#C9A227]/10 border border-[#C9A227]/20 rounded px-2 py-1.5 text-[#C9A227] hover:bg-[#C9A227]/20 transition text-xs">
                <Plus size={12} /> Add Order
              </button>
              <button className="w-full flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white/70 hover:bg-white/10 transition text-xs">
                <Users size={12} /> Manage Workers
              </button>
            </div>
          </div>
        )}

        {/* Recent orders table – compact version */}
        <div
          className={`bg-white/5 rounded-xl border border-white/5 ${compact ? "p-1.5" : "p-4"}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <h3
              className={`${compact ? "text-[10px]" : "text-sm"} font-medium text-white/70`}
            >
              Recent Orders
            </h3>
            <button
              className={`${compact ? "text-[8px]" : "text-xs"} text-[#C9A227] hover:text-[#C9A227]/80 transition flex items-center gap-0.5`}
            >
              View All <ChevronRight size={compact ? 10 : 14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full ${compact ? "text-[8px]" : "text-sm"}`}>
              <thead>
                <tr className="text-left text-white/30 border-b border-white/5">
                  <th className={`${compact ? "py-1" : "pb-2"} font-medium`}>
                    Order
                  </th>
                  <th className={`${compact ? "py-1" : "pb-2"} font-medium`}>
                    Customer
                  </th>
                  <th className={`${compact ? "py-1" : "pb-2"} font-medium`}>
                    Items
                  </th>
                  <th className={`${compact ? "py-1" : "pb-2"} font-medium`}>
                    Total
                  </th>
                  <th className={`${compact ? "py-1" : "pb-2"} font-medium`}>
                    Status
                  </th>
                  {!compact && (
                    <th className="pb-2 font-medium text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(compact ? recentOrders.slice(0, 2) : recentOrders).map(
                  (order, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                    >
                      <td
                        className={`${compact ? "py-1" : "py-2"} text-white/60 font-mono`}
                      >
                        {order.id}
                      </td>
                      <td
                        className={`${compact ? "py-1" : "py-2"} text-white/80`}
                      >
                        {order.customer}
                      </td>
                      <td
                        className={`${compact ? "py-1" : "py-2"} text-white/50`}
                      >
                        {order.items}
                      </td>
                      <td
                        className={`${compact ? "py-1" : "py-2"} text-white/80`}
                      >
                        {order.total}
                      </td>
                      <td className="py-1">
                        <span
                          className={`px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(order.status)} ${compact ? "text-[7px]" : "text-[10px]"}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      {!compact && (
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Eye
                              size={14}
                              className="text-white/30 hover:text-white/60 cursor-pointer"
                            />
                            <Edit
                              size={14}
                              className="text-white/30 hover:text-[#C9A227] cursor-pointer"
                            />
                            <Trash2
                              size={14}
                              className="text-white/30 hover:text-red-400 cursor-pointer"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
        {!compact && (
          <div className="text-center text-[10px] text-white/20 mt-3">
            Melmah Admin v2.0
          </div>
        )}
      </main>
    </div>
  );
}
