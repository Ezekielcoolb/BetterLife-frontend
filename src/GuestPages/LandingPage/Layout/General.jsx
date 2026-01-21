import { Outlet } from "react-router-dom";
import Nav from "../Nav";

export default function GeneralLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />

      <main className="w-full pt-0 pb-0">
        <Outlet />
      </main>
    </div>
  );
}
