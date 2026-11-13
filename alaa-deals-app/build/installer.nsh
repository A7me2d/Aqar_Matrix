; مخصّص لمثبّت Aqar Matrix (electron-builder بيضمّه تلقائياً)
; بعد التثبيت: امسح اختصارات النسخة القديمة (Alaa Deals) لو فضلت، وحدّث كاش أيقونات ويندوز
; عشان الأيقونة تظهر صح فوراً في الشريط وقايمة ابدأ وسطح المكتب.
!macro customInstall
  Delete "$DESKTOP\Alaa Deals.lnk"
  Delete "$SMPROGRAMS\Alaa Deals.lnk"
  Delete "$SMPROGRAMS\Alaa Deals\Alaa Deals.lnk"
  RMDir "$SMPROGRAMS\Alaa Deals"
  ; SHCNE_ASSOCCHANGED = 0x08000000 (تحديث الأيقونات)
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
