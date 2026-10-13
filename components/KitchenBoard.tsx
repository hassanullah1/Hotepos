"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, ChefHat, CheckCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Menu data (unchanged – static food items)
const FOOD_ITEMS = {
  pizza: [
    { name: "Margherita", price: 300 },
    { name: "Pepperoni", price: 350 },
    { name: "Veggie", price: 320 },
  ],
  chicken: [
    { name: "Grilled Chicken", price: 400 },
    { name: "Fried Chicken", price: 380 },
    { name: "Chicken Tikka", price: 420 },
  ],
  drinks: [
    { name: "Coffee", price: 150 },
    { name: "Tea", price: 100 },
    { name: "Soda", price: 120 },
  ],
  soups: [
    { name: "Tomato Soup", price: 180 },
    { name: "Chicken Soup", price: 220 },
  ],
  desserts: [
    { name: "Cheesecake", price: 250 },
    { name: "Brownie", price: 200 },
  ],
  sides: [
    { name: "Fries", price: 140 },
    { name: "Garlic Bread", price: 160 },
    { name: "Salad", price: 180 },
  ],
};

const MENU_KEYS = ["pizza", "chicken", "drinks", "soups", "desserts", "sides"];
const MAX_NEW_ORDERS = 3;

export default function KitchenBoard({ isRTL }) {
  const t = useTranslation();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Order state (unchanged)
  const [orders, setOrders] = useState({ new: [], preparing: [], ready: [] });
  const [orderIdCounter, setOrderIdCounter] = useState(1);
  const [movingOrderId, setMovingOrderId] = useState(null);
  const [moveDirection, setMoveDirection] = useState(null);

  // Intersection Observer (unchanged)
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Auto-generate orders (unchanged)
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        if (prevOrders.new.length >= MAX_NEW_ORDERS) return prevOrders;
        const randomKey =
          MENU_KEYS[Math.floor(Math.random() * MENU_KEYS.length)];
        const items = FOOD_ITEMS[randomKey];
        if (!items) return prevOrders;
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const newOrder = {
          id: orderIdCounter,
          items: [randomItem],
          total: randomItem.price,
        };
        setOrderIdCounter((prev) => prev + 1);
        return {
          ...prevOrders,
          new: [...prevOrders.new, newOrder],
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible, orderIdCounter]);

  // Auto-move orders (unchanged)
  useEffect(() => {
    if (!isVisible) return;
    const timers = [];

    const moveOrder = (orderId, from, to) => {
      setOrders((prevOrders) => {
        const order = prevOrders[from]?.find((o) => o.id === orderId);
        if (!order) return prevOrders;
        const source = prevOrders[from].filter((o) => o.id !== orderId);
        const dest = [...prevOrders[to], order];
        return {
          ...prevOrders,
          [from]: source,
          [to]: dest,
        };
      });

      setMovingOrderId(orderId);
      setMoveDirection("forward");
      setTimeout(() => {
        setMovingOrderId(null);
        setMoveDirection(null);
      }, 400);
    };

    if (orders.new.length > 0) {
      timers.push(
        setTimeout(() => {
          moveOrder(orders.new[0].id, "new", "preparing");
        }, 4000),
      );
    }
    if (orders.preparing.length > 0) {
      timers.push(
        setTimeout(() => {
          moveOrder(orders.preparing[0].id, "preparing", "ready");
        }, 4000),
      );
    }
    if (orders.ready.length > 0) {
      timers.push(
        setTimeout(() => {
          setOrders((prevOrders) => ({
            ...prevOrders,
            ready: prevOrders.ready.slice(1),
          }));
        }, 4000),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [orders, isVisible]);

  // ----- Column Component (now uses translations) -----
  const Column = ({ title, icon: Icon, status, orders, color }) => (
    <div className="flex-1 min-w-[80px] bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/10">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={14} className={`text-${color}-400`} />
        <h3 className="text-[10px] font-semibold text-white">{title}</h3>
        <span className="ml-auto text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full text-white/80">
          {orders.length}
        </span>
      </div>
      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {orders.map((order) => {
          const isMoving = movingOrderId === order.id;
          return (
            <div
              key={order.id}
              className={`
                bg-white/10 backdrop-blur-sm rounded-md p-1.5 border-l-3 
                ${status === "new" ? "border-blue-400" : status === "preparing" ? "border-amber-400" : "border-green-400"}
                transition-all duration-300 ease-out
                ${isMoving ? (moveDirection === "forward" ? "translate-x-1.5 opacity-50" : "-translate-x-1.5 opacity-50") : ""}
                text-[9px]
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white/50">#{order.id}</span>
                  <span className="font-medium text-white truncate max-w-[80px]">
                    {order.items.map((item) => item.name).join(", ")}
                  </span>
                  <span className="text-white/60">{order.total} Af</span>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-white/30 text-center text-[8px] py-2">
            {t.kitchenNoOrders}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative py-8 md:py-12 overflow-hidden"
      style={{ backgroundColor: "#1e1e1e" }}
    >
      {/* Background textures (unchanged) */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] items-center gap-6 lg:gap-8">
        {/* Text Column */}
        <div
          className={`transition-all duration-700 ease-out will-change-transform ${
            isVisible
              ? "opacity-100 translate-y-0 scale-y-100"
              : "opacity-0 -translate-y-8 scale-y-0"
          }`}
          style={{ transformOrigin: "top center" }}
        >
          <h2 className="font-serif text-2xl leading-tight text-white sm:text-3xl drop-shadow-md">
            {t.kitchenTitle}
          </h2>
          <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-gray-300">
            {t.kitchenSubtitle}
          </p>
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 bg-blue-900/50 text-blue-200 text-sm px-3 py-1 rounded-full backdrop-blur-sm border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {t.kitchenStatusNew}
              </span>
              <span className="inline-flex items-center gap-2 bg-amber-900/50 text-amber-200 text-sm px-3 py-1 rounded-full backdrop-blur-sm border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {t.kitchenStatusPreparing}
              </span>
              <span className="inline-flex items-center gap-2 bg-green-900/50 text-green-200 text-sm px-3 py-1 rounded-full backdrop-blur-sm border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {t.kitchenStatusReady}
              </span>
            </div>
          </div>
        </div>

        {/* TV Screen */}
        <div
          className={`flex items-center justify-center transition-all duration-700 ease-out delay-150 will-change-transform ${
            isVisible
              ? "opacity-100 translate-y-0 scale-y-100"
              : "opacity-0 translate-y-10 scale-y-0"
          }`}
          style={{ transformOrigin: "bottom center" }}
        >
          <div
            className="relative w-full max-w-[460px] aspect-[4/3] transform-gpu transition-transform duration-500"
            style={{
              transform: "rotateX(4deg) rotateY(-2deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="absolute -inset-4 bg-black/50 rounded-3xl blur-2xl -z-10" />
            <div className="absolute inset-0 bg-[#2c2c2c] rounded-2xl p-2.5 shadow-2xl shadow-black/60 border border-white/10">
              <div className="relative z-10 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e] rounded-xl p-2.5 h-full flex flex-col">
                {/* TV Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-white/40 font-mono">
                      ● LIVE
                    </span>
                    <span className="text-[8px] text-white/60">
                      {t.kitchenTvLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-white/40">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Three Columns */}
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  <Column
                    title={t.kitchenColumnNew}
                    icon={Clock}
                    status="new"
                    orders={orders.new}
                    color="blue"
                  />
                  <Column
                    title={t.kitchenColumnPreparing}
                    icon={ChefHat}
                    status="preparing"
                    orders={orders.preparing}
                    color="amber"
                  />
                  <Column
                    title={t.kitchenColumnReady}
                    icon={CheckCircle}
                    status="ready"
                    orders={orders.ready}
                    color="green"
                  />
                </div>

                {/* Footer "Auto" */}
                <div className="mt-1 text-center text-white/20 text-[6px]">
                  {t.kitchenAutoLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
