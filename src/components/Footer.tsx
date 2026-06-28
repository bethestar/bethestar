import Link from "next/link";
import { taxLaws, mainMenuItems } from "@/lib/menuData";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">TH</span>
              </div>
              <span className="text-lg font-bold text-white">택스허브</span>
            </div>
            <p className="text-sm leading-relaxed">
              세무 전문가를 위한
              <br />
              통합 법령·실무 플랫폼
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">세무</h3>
            <ul className="space-y-2 text-sm">
              {taxLaws.slice(0, 5).map((law) => (
                <li key={law.id}>
                  <Link href={`/tax/${law.id}`} className="hover:text-white transition-colors">
                    {law.shortLabel || law.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">서비스</h3>
            <ul className="space-y-2 text-sm">
              {mainMenuItems.slice(2).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">고객지원</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/notice" className="hover:text-white transition-colors">
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">&copy; 2024 택스허브. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
