import Link from "next/link";

export default function LockedShelf() {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-[2rem] border border-white/90 bg-white/85 p-8 text-center shadow-[0_18px_60px_rgba(92,75,81,0.08)] backdrop-blur-xl sm:mt-16">
      <div className="text-5xl">🔒</div>
      <h1 className="mt-4 font-cute text-2xl font-black text-text-warm">书架现在是锁定状态</h1>
      <p className="mt-3 text-sm font-semibold leading-7 text-text-soft">
        为了保护本机记录，请先回到首页输入昵称和 6 位 PIN 解锁，再继续查看或编辑内容。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-pill bg-coral px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-coral/15 hover:-translate-y-0.5 hover:bg-coral-dark"
      >
        返回首页解锁
      </Link>
    </div>
  );
}
