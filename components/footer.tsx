"use client"

import { Mail, Phone, MapPin, Facebook, Linkedin, Send } from "lucide-react"
import Image from "next/image"
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image 
                src="/logo.png" 
                alt={t('logoAlt')}
                width={48} 
                height={48}
                className="h-12 w-auto"
              />
              <span className="font-bold text-xl text-gray-900">
                {t('companyName')}
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              {t('description')}
            </p>
            
            {/* Social Media */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">{t('followUs')}</span>
              <div className="flex space-x-2">
                <a
                  href="https://facebook.com/azmerawbekele"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  aria-label="Facebook"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-blue-600 transition-all duration-300 shadow-sm hover:shadow-md group-hover:scale-110">
                    <Facebook className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                </a>
                
                <a
                  href="https://t.me/azmerawbekele"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  aria-label="Telegram"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md group-hover:scale-110">
                    <Send className="h-5 w-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                  </div>
                </a>
                
                <a
                  href="https://linkedin.com/company/azmerawbekele"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  aria-label="LinkedIn"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-blue-700 transition-all duration-300 shadow-sm hover:shadow-md group-hover:scale-110">
                    <Linkedin className="h-5 w-5 text-gray-600 group-hover:text-blue-700 transition-colors" />
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">{t('contactUs')}</h3>
            <div className="space-y-3">
              <a 
                href="mailto:info@azmerawbekele.com"
                className="flex items-center space-x-3 text-gray-600 hover:text-green-700 transition-colors group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Mail className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm">info@azmerawbekele.com</span>
              </a>
              <a 
                href="tel:+251111275398"
                className="flex items-center space-x-3 text-gray-600 hover:text-green-700 transition-colors group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Phone className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm">+251 111 275 398</span>
              </a>
              <div className="flex items-start space-x-3 text-gray-600">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mt-0.5">
                  <MapPin className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm leading-relaxed">
                  Churchill Avenue, Eshetu Mamo Building - F8<br />
                  Office 801
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-8 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} {t('companyName')}. {t('rightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  )
}
