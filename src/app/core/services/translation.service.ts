import { Injectable, signal } from '@angular/core';

export type Language = 'ar' | 'en';

export interface TranslationKeys {
  // Common
  'common.loading': string;
  'common.save': string;
  'common.cancel': string;
  'common.edit': string;
  'common.delete': string;
  'common.search': string;
  'common.add': string;
  'common.submit': string;
  'common.back': string;
  'common.close': string;
  'common.yes': string;
  'common.no': string;
  'common.viewAll': string;
  'common.openLink': string;
  'common.download': string;
  'common.clear': string;
  'common.saving': string;
  'common.update': string;

  // Auth
  'auth.welcomeBack': string;
  'auth.signIn': string;
  'auth.signingIn': string;
  'auth.email': string;
  'auth.password': string;
  'auth.emailPlaceholder': string;
  'auth.passwordPlaceholder': string;
  'auth.loginSubtitle': string;
  'auth.emailError': string;
  'auth.passwordError': string;
  'auth.signOut': string;

  // Dashboard
  'dashboard.welcome': string;
  'dashboard.subtitle': string;
  'dashboard.courseProgress': string;
  'dashboard.keepGoing': string;
  'dashboard.sessionsAttended': string;
  'dashboard.goodJob': string;
  'dashboard.assignmentsCompleted': string;
  'dashboard.excellent': string;
  'dashboard.overallScore': string;
  'dashboard.nice': string;
  'dashboard.continueLearning': string;
  'dashboard.recordedOn': string;
  'dashboard.watchSession': string;
  'dashboard.viewMaterials': string;
  'dashboard.latestAssignment': string;
  'dashboard.dueIn': string;
  'dashboard.days': string;
  'dashboard.due': string;
  'dashboard.startAssignment': string;
  'dashboard.recentAnnouncements': string;
  'dashboard.allSessions': string;
  'dashboard.session': string;
  'dashboard.submitPR': string;
  'dashboard.submitted': string;
  'dashboard.pending': string;
  'dashboard.accepted': string;
  'dashboard.needsRework': string;
  'dashboard.githubLink': string;
  'dashboard.viewFeedback': string;
  'dashboard.nextSession': string;
  'dashboard.viewSchedule': string;
  'dashboard.progressOverview': string;

  // Admin
  'admin.sessions': string;
  'admin.searchSessions': string;
  'admin.addSession': string;
  'admin.editSession': string;
  'admin.title': string;
  'admin.description': string;
  'admin.orderIndex': string;
  'admin.status': string;
  'admin.studentStatus': string;
  'admin.recordedDate': string;
  'admin.duration': string;
  'admin.hours': string;
  'admin.minutes': string;
  'admin.recordingLink': string;
  'admin.slideLink': string;
  'admin.assetsLink': string;
  'admin.assignmentTitle': string;
  'admin.assignmentDescription': string;
  'admin.assignmentDueDate': string;
  'admin.draft': string;
  'admin.published': string;
  'admin.upcoming': string;
  'admin.inProgress': string;
  'admin.completed': string;
  'admin.actions': string;
  'admin.deleteConfirm': string;
  'admin.totalSessions': string;
  'admin.totalSubmissions': string;
  'admin.pendingReviews': string;
  'admin.submissions': string;
  'admin.student': string;
  'admin.task': string;
  'admin.submittedAt': string;
  'admin.prLink': string;
  'admin.feedback': string;
  'admin.accept': string;
  'admin.reject': string;
  'admin.writeFeedback': string;
  'admin.noSubmissions': string;
  'admin.statistics': string;
  'admin.overview': string;
  'admin.dashboardOverview': string;
  'admin.welcomeMessage': string;
  'admin.quickActions': string;
  'admin.addNewSession': string;
  'admin.addNewSessionDesc': string;
  'admin.reviewSubmissions': string;
  'admin.reviewSubmissionsDesc': string;
  'admin.studentSubmissions': string;
  'admin.studentSubmissionsDesc': string;
  'admin.loadingSubmissions': string;
  'admin.noSubmissionsWaiting': string;
  'admin.viewCode': string;
  'admin.evaluate': string;
  'admin.sessionOrder': string;
  'admin.adminStatus': string;
  'admin.studentState': string;
  'admin.sessionDuration': string;
  'admin.recordingLinkLabel': string;
  'admin.resourcesLinks': string;
  'admin.assignmentDetails': string;
  'admin.saveSession': string;
  'admin.updateSession': string;
  'admin.orderError': string;
  'admin.dateError': string;
  'admin.dueDateError': string;

  // Session Details
  'session.details': string;
  'session.materials': string;
  'session.recording': string;
  'session.slides': string;
  'session.assets': string;
  'session.assignment': string;
  'session.submitAssignment': string;
  'session.githubLinkPlaceholder': string;
  'session.submitting': string;
  'session.successMessage': string;
  'session.githubLinkRequired': string;
  'session.watchOnOneDrive': string;
  'session.openPresentation': string;
  'session.downloadFiles': string;
  'session.openSlides': string;
  'session.requiredTask': string;
  'session.viewTask': string;
  'session.noAssignment': string;
  'session.pastePRLink': string;
  'session.updateBeforeDeadline': string;
  'session.breadcrumbSessions': string;

  // Sidebar
  'sidebar.dashboard': string;
  'sidebar.sessions': string;
  'sidebar.myProgress': string;
  'sidebar.support': string;
  'sidebar.adminPanel': string;
  'sidebar.manageSubmissions': string;
  'sidebar.settings': string;
  'sidebar.assignments': string;
  'sidebar.attendance': string;
  'sidebar.profile': string;
  'sidebar.studentRole': string;
  'sidebar.bootcampName': string;

  // Sidebar - new
  'sidebar.myCourse': string;

  // Course page
  'course.recordingAvailable': string;
  'course.resources': string;
  'course.openSession': string;
  'course.watchRecording': string;
  'course.openSlides': string;
  'course.downloadResources': string;
  'course.submitAssignment': string;

  // Dashboard - new
  'dashboard.currentAssignment': string;
  'dashboard.waitingReview': string;
  'dashboard.notSubmitted': string;
  'dashboard.noAssignment': string;
  'dashboard.upcomingSession': string;
  'dashboard.noUpcoming': string;
  'dashboard.allCompleted': string;
  'dashboard.viewSession': string;
  'dashboard.timeRemaining': string;
  'dashboard.hours': string;
  'dashboard.minutes': string;
  'dashboard.seconds': string;
  'dashboard.deadlinePassed': string;
  'dashboard.lateSubmission': string;

  // Submission
  'submission.repoUrl': string;
  'submission.prUrl': string;
  'submission.optional': string;
  'submission.status': string;
  'submission.submissionDate': string;
  'submission.lastUpdate': string;

  // Profile
  'profile.subtitle': string;

  // Progress
  'progress.subtitle': string;
  'progress.tasksCompleted': string;
  'progress.sessionBreakdown': string;

  // Sessions Sidebar
  'sessions.bootcampBatch': string;

  // Admin Sidebar
  'admin.brandName': string;
  'admin.adminLabel': string;
  'admin.dashboard': string;
  'admin.bootcamps': string;
  'admin.assignments': string;
  'admin.students': string;
  'admin.superAdmin': string;

  // Language
  'lang.switchLanguage': string;
  'lang.arabic': string;
  'lang.english': string;

  // Bug Report
  'bugReport.title': string;
  'bugReport.subtitle': string;
  'bugReport.tooltip': string;
  'bugReport.category': string;
  'bugReport.bugTitle': string;
  'bugReport.description': string;
  'bugReport.titlePlaceholder': string;
  'bugReport.descriptionPlaceholder': string;
  'bugReport.categoryUi': string;
  'bugReport.categoryFunctionality': string;
  'bugReport.categoryPerformance': string;
  'bugReport.categorySubmission': string;
  'bugReport.categoryOther': string;
  'bugReport.reportingAs': string;
  'bugReport.submitReport': string;
  'bugReport.submitting': string;
  'bugReport.successTitle': string;
  'bugReport.successMessage': string;
  'bugReport.errorMessage': string;

  // Admin Bug Reports
  'adminBugs.title': string;
  'adminBugs.subtitle': string;
  'adminBugs.refresh': string;
  'adminBugs.open': string;
  'adminBugs.inProgress': string;
  'adminBugs.resolved': string;
  'adminBugs.closed': string;
  'adminBugs.searchPlaceholder': string;
  'adminBugs.allStatus': string;
  'adminBugs.loading': string;
  'adminBugs.noReports': string;
  'adminBugs.noReportsDesc': string;
  'adminBugs.bug': string;
  'adminBugs.category': string;
  'adminBugs.reporter': string;
  'adminBugs.status': string;
  'adminBugs.date': string;
  'adminBugs.actions': string;
  'adminBugs.markInProgress': string;
  'adminBugs.markResolved': string;
  'adminBugs.close': string;
  'adminBugs.reopen': string;
  'adminBugs.delete': string;
  'adminBugs.deleteConfirm': string;
  'adminBugs.details': string;
  'adminBugs.description': string;
  'adminBugs.reportedBy': string;
  'adminBugs.reportedOn': string;
  'adminBugs.updateStatus': string;
  'adminBugs.deleteReport': string;
  'adminBugs.sidebarLabel': string;
  'adminBugs.loadError': string;
  'adminBugs.categoryUi': string;
  'adminBugs.categoryFunctionality': string;
  'adminBugs.categoryPerformance': string;
  'adminBugs.categorySubmission': string;
  'adminBugs.categoryOther': string;

  // Errors & Messages
  'error.loadFailed': string;
  'error.loginFailed': string;
  'error.submissionFailed': string;
  'error.sessionExpired': string;
  'success.sessionAdded': string;
  'success.sessionUpdated': string;
  'success.sessionDeleted': string;
  'success.statusUpdated': string;
  'success.submissionSuccess': string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang = signal<Language>('ar');

  private translations: Record<Language, TranslationKeys> = {
    ar: {
      // Common
      'common.loading': 'جاري التحميل...',
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.edit': 'تعديل',
      'common.delete': 'حذف',
      'common.search': 'بحث',
      'common.add': 'إضافة',
      'common.submit': 'إرسال',
      'common.back': 'رجوع',
      'common.close': 'إغلاق',
      'common.yes': 'نعم',
      'common.no': 'لا',
      'common.viewAll': 'عرض الكل',
      'common.openLink': 'افتح الرابط',
      'common.download': 'تنزيل',
      'common.clear': 'مسح',
      'common.saving': 'جاري الحفظ',
      'common.update': 'تحديث',

      // Auth
      'auth.welcomeBack': 'أكاديمية كوديك',
      'auth.signIn': 'تسجيل الدخول',
      'auth.signingIn': 'جاري تسجيل الدخول...',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.emailPlaceholder': 'student@example.com',
      'auth.passwordPlaceholder': '••••••••',
      'auth.loginSubtitle': 'سجل دخولك للوصول إلى مساحة التعلم الخاصة بك',
      'auth.emailError': 'يرجى إدخال بريد إلكتروني صحيح',
      'auth.passwordError': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
      'auth.signOut': 'تسجيل الخروج',

      // Dashboard
      'dashboard.welcome': 'مرحباً بك',
      'dashboard.subtitle': 'استمر في التعلم وابنِ أشياء رائعة',
      'dashboard.courseProgress': 'تقدم الدورة',
      'dashboard.keepGoing': 'استمر!',
      'dashboard.sessionsAttended': 'المحاضرات المحضورة',
      'dashboard.goodJob': 'أحسنت!',
      'dashboard.assignmentsCompleted': 'التكليفات المكتملة',
      'dashboard.excellent': 'ممتاز!',
      'dashboard.overallScore': 'الدرجة الإجمالية',
      'dashboard.nice': 'رائع!',
      'dashboard.continueLearning': 'تابع التعلم',
      'dashboard.recordedOn': 'تم التسجيل في',
      'dashboard.watchSession': 'شاهد المحاضره',
      'dashboard.viewMaterials': 'عرض المواد',
      'dashboard.latestAssignment': 'أحدث تكليف',
      'dashboard.dueIn': 'متبقي',
      'dashboard.days': 'أيام',
      'dashboard.due': 'الموعد النهائي',
      'dashboard.startAssignment': 'ابدأ التكليف',
      'dashboard.recentAnnouncements': 'الإعلانات الأخيرة',
      'dashboard.allSessions': 'جميع المحاضرات',
      'dashboard.session': 'المحاضره',
      'dashboard.submitPR': 'إرسال الحل',
      'dashboard.submitted': 'تم الإرسال',
      'dashboard.pending': 'قيد المراجعة',
      'dashboard.accepted': 'مقبول',
      'dashboard.needsRework': 'يحتاج إعادة عمل',
      'dashboard.githubLink': 'رابط GitHub',
      'dashboard.viewFeedback': 'عرض التعليقات',
      'dashboard.nextSession': 'المحاضره التالية',
      'dashboard.viewSchedule': 'عرض الجدول',
      'dashboard.progressOverview': 'نظرة عامة على التقدم',

      // Admin
      'admin.sessions': 'الجلسات',
      'admin.searchSessions': 'ابحث عن جلسة...',
      'admin.addSession': 'إضافة جلسة',
      'admin.editSession': 'تعديل المحاضره',
      'admin.title': 'العنوان',
      'admin.description': 'الوصف',
      'admin.orderIndex': 'الترتيب',
      'admin.status': 'الحالة',
      'admin.studentStatus': 'حالة الطالب',
      'admin.recordedDate': 'تاريخ التسجيل',
      'admin.duration': 'المدة',
      'admin.hours': 'ساعة',
      'admin.minutes': 'دقيقة',
      'admin.recordingLink': 'رابط التسجيل',
      'admin.slideLink': 'رابط العرض التقديمي',
      'admin.assetsLink': 'رابط المصادر',
      'admin.assignmentTitle': 'عنوان التكليف',
      'admin.assignmentDescription': 'وصف التكليف',
      'admin.assignmentDueDate': 'موعد التسليم',
      'admin.draft': 'مسودة',
      'admin.published': 'منشور',
      'admin.upcoming': 'قادم',
      'admin.inProgress': 'جاري',
      'admin.completed': 'مكتمل',
      'admin.actions': 'الإجراءات',
      'admin.deleteConfirm': 'هل أنت متأكد من حذف هذه المحاضره؟ لا يمكن التراجع عن هذا الإجراء.',
      'admin.totalSessions': 'إجمالي الجلسات',
      'admin.totalSubmissions': 'إجمالي التسليمات',
      'admin.pendingReviews': 'بانتظار المراجعة',
      'admin.submissions': 'التسليمات',
      'admin.student': 'الطالب',
      'admin.task': 'المهمة',
      'admin.submittedAt': 'تاريخ التسليم',
      'admin.prLink': 'رابط PR',
      'admin.feedback': 'التعليقات',
      'admin.accept': 'قبول',
      'admin.reject': 'رفض',
      'admin.writeFeedback': 'اكتب ملاحظاتك هنا...',
      'admin.noSubmissions': 'لا توجد تسليمات حتى الآن',
      'admin.statistics': 'الإحصائيات',
      'admin.overview': 'نظرة عامة',
      'admin.dashboardOverview': 'نظرة عامة على لوحة التحكم',
      'admin.welcomeMessage': 'مرحباً بك في لوحة التحكم',
      'admin.quickActions': 'الإجراءات السريعة',
      'admin.addNewSession': 'إضافة جلسة جديدة',
      'admin.addNewSessionDesc': 'أضف جلسة جديدة',
      'admin.reviewSubmissions': 'مراجعة التسليمات',
      'admin.reviewSubmissionsDesc': 'راجع التسليمات',
      'admin.studentSubmissions': 'التسليمات الطالب',
      'admin.studentSubmissionsDesc': 'التسليمات الطالب',
      'admin.loadingSubmissions': 'جاري التحميل',
      'admin.noSubmissionsWaiting': 'لا توجد تسليمات معلقة',
      'admin.viewCode': 'عرض الكود',
      'admin.evaluate': 'تقييم',
      'admin.sessionOrder': 'الترتيب',
      'admin.adminStatus': 'حالة الإدارة',
      'admin.studentState': 'حالة الطالب',
      'admin.sessionDuration': 'المدة',
      'admin.recordingLinkLabel': 'رابط التسجيل',
      'admin.resourcesLinks': 'الموارد',
      'admin.assignmentDetails': 'تفاصيل التكليف',
      'admin.saveSession': 'حفظ المحاضره',
      'admin.updateSession': 'تحديث المحاضره',
      'admin.orderError': 'خطأ في الترتيب',
      'admin.dateError': 'خطأ في التاريخ',
      'admin.dueDateError': 'خطأ في تاريخ التسليم',

      // Session Details
      'session.details': 'تفاصيل المحاضره',
      'session.materials': 'المواد',
      'session.recording': 'التسجيل',
      'session.slides': 'العرض التقديمي',
      'session.assets': 'المصادر',
      'session.assignment': 'التكليف',
      'session.submitAssignment': 'إرسال التكليف',
      'session.githubLinkPlaceholder': 'https://github.com/username/repo/pull/123',
      'session.submitting': 'جاري الإرسال...',
      'session.successMessage': 'تم إرسال التكليف بنجاح! 🎉',
      'session.githubLinkRequired': 'يجب أن يكون رابط GitHub صحيحاً',
      'session.watchOnOneDrive': 'شاهد على OneDrive',
      'session.openPresentation': 'افتح العرض التقديمي',
      'session.downloadFiles': 'تنزيل الملفات',
      'session.openSlides': 'افتح العرض التقديمي',
      'session.requiredTask': 'المهمة المطلوبة',
      'session.viewTask': 'عرض المهمة',
      'session.noAssignment': 'لا توجد تكليفات لهذه المحاضره 🎉',
      'session.pastePRLink': 'الصق رابط الـ Pull Request من GitHub',
      'session.updateBeforeDeadline': 'يمكنك تحديث الحل الخاص بك قبل الموعد النهائي.',
      'session.breadcrumbSessions': 'المسارات',

      // Sidebar
      'sidebar.dashboard': 'لوحة التحكم',
      'sidebar.sessions': 'المحاضرات',
      'sidebar.myProgress': 'تقدمي',
      'sidebar.support': 'الدعم',
      'sidebar.adminPanel': 'لوحة الإدارة',
      'sidebar.manageSubmissions': 'إدارة التسليمات',
      'sidebar.settings': 'الإعدادات',
      'sidebar.assignments': 'التكليفات',
      'sidebar.attendance': 'الحضور',
      'sidebar.profile': 'الملف الشخصي',
      'sidebar.studentRole': 'طالب',
      'sidebar.bootcampName': 'اسم الكوديك',

      // Sidebar - new
      'sidebar.myCourse': 'الدورة',

      // Course page
      'course.recordingAvailable': 'تسجيل متاح',
      'course.resources': 'مصادر',
      'course.openSession': 'فتح المحاضره',
      'course.watchRecording': 'شاهد التسجيل',
      'course.openSlides': 'افتح العرض',
      'course.downloadResources': 'تنزيل المصادر',
      'course.submitAssignment': 'إرسال التكليف',

      // Dashboard - new
      'dashboard.currentAssignment': 'التكليف الحالي',
      'dashboard.waitingReview': 'بانتظار المراجعة',
      'dashboard.notSubmitted': 'لم يتم الإرسال',
      'dashboard.noAssignment': 'لا توجد تكليفات',
      'dashboard.upcomingSession': 'المحاضره القادمة',
      'dashboard.noUpcoming': 'لا توجد محاضرات قادمة',
      'dashboard.allCompleted': 'أكملت جميع المحاضرات',
      'dashboard.viewSession': 'عرض المحاضره',
      'dashboard.timeRemaining': 'الوقت المتبقي',
      'dashboard.hours': 'ساعات',
      'dashboard.minutes': 'دقائق',
      'dashboard.seconds': 'ثواني',
      'dashboard.deadlinePassed': 'انتهى الموعد النهائي',
      'dashboard.lateSubmission': 'يرجى التسليم في أقرب وقت ممكن',

      // Submission
      'submission.repoUrl': 'رابط المستودع',
      'submission.prUrl': 'رابط الـ Pull Request',
      'submission.optional': 'اختياري',
      'submission.status': 'حالة التسليم',
      'submission.submissionDate': 'تاريخ التسليم',
      'submission.lastUpdate': 'آخر تحديث',

      // Profile
      'profile.subtitle': 'معلوماتك الشخصية وإحصائياتك',

      // Progress
      'progress.subtitle': 'تتبع تقدمك في الدورة',
      'progress.tasksCompleted': 'تكليفات مكتملة',
      'progress.sessionBreakdown': 'تفاصيل المحاضرات',

      // Sessions Sidebar
      'sessions.bootcampBatch': 'Java Spring Bootcamp - الدفعة 5',

      // Admin Sidebar
      'admin.brandName': 'CodeCampus',
      'admin.adminLabel': 'الإدارة',
      'admin.dashboard': 'لوحة التحكم',
      'admin.bootcamps': 'البوتكامبات',
      'admin.assignments': 'التكليفات',
      'admin.students': 'الطلاب',
      'admin.superAdmin': 'مدير عام',

      // Language
      'lang.switchLanguage': 'English',
      'lang.arabic': 'العربية',
      'lang.english': 'English',

      // Bug Report
      'bugReport.title': 'الإبلاغ عن مشكلة',
      'bugReport.subtitle': 'ساعدنا في التحسين عبر الإبلاغ عن المشاكل',
      'bugReport.tooltip': 'الإبلاغ عن مشكلة',
      'bugReport.category': 'التصنيف',
      'bugReport.bugTitle': 'عنوان المشكلة',
      'bugReport.description': 'الوصف',
      'bugReport.titlePlaceholder': 'وصف مختصر للمشكلة',
      'bugReport.descriptionPlaceholder': 'يرجى وصف المشكلة بالتفصيل. ماذا كنت تتوقع أن يحدث؟ وماذا حدث فعلاً؟',
      'bugReport.categoryUi': 'مشكلة في الواجهة',
      'bugReport.categoryFunctionality': 'خلل في الوظائف',
      'bugReport.categoryPerformance': 'مشكلة في الأداء',
      'bugReport.categorySubmission': 'مشكلة في التسليم',
      'bugReport.categoryOther': 'أخرى',
      'bugReport.reportingAs': 'الإبلاغ بواسطة:',
      'bugReport.submitReport': 'إرسال البلاغ',
      'bugReport.submitting': 'جاري الإرسال...',
      'bugReport.successTitle': 'تم إرسال البلاغ!',
      'bugReport.successMessage': 'شكراً لمساعدتنا في التحسين.',
      'bugReport.errorMessage': 'فشل إرسال البلاغ. يرجى المحاولة مرة أخرى.',

      // Admin Bug Reports
      'adminBugs.title': 'تقارير الأخطاء',
      'adminBugs.subtitle': 'عرض وإدارة الأخطاء المُبلَّغ عنها',
      'adminBugs.refresh': 'تحديث',
      'adminBugs.open': 'مفتوح',
      'adminBugs.inProgress': 'قيد المعالجة',
      'adminBugs.resolved': 'تم الحل',
      'adminBugs.closed': 'مغلق',
      'adminBugs.searchPlaceholder': 'ابحث في تقارير الأخطاء...',
      'adminBugs.allStatus': 'جميع الحالات',
      'adminBugs.loading': 'جاري تحميل تقارير الأخطاء...',
      'adminBugs.noReports': 'لا توجد تقارير أخطاء',
      'adminBugs.noReportsDesc': 'كل شيء على ما يرام! لم يتم الإبلاغ عن أي أخطاء بعد.',
      'adminBugs.bug': 'الخطأ',
      'adminBugs.category': 'التصنيف',
      'adminBugs.reporter': 'المُبلِّغ',
      'adminBugs.status': 'الحالة',
      'adminBugs.date': 'التاريخ',
      'adminBugs.actions': 'الإجراءات',
      'adminBugs.markInProgress': 'تحويل لقيد المعالجة',
      'adminBugs.markResolved': 'تحديد كمحلول',
      'adminBugs.close': 'إغلاق',
      'adminBugs.reopen': 'إعادة فتح',
      'adminBugs.delete': 'حذف',
      'adminBugs.deleteConfirm': 'هل أنت متأكد من حذف هذا التقرير؟',
      'adminBugs.details': 'تفاصيل تقرير الخطأ',
      'adminBugs.description': 'الوصف',
      'adminBugs.reportedBy': 'أبلغ بواسطة',
      'adminBugs.reportedOn': 'تاريخ البلاغ',
      'adminBugs.updateStatus': 'تحديث الحالة',
      'adminBugs.deleteReport': 'حذف التقرير',
      'adminBugs.sidebarLabel': 'تقارير الأخطاء',
      'adminBugs.loadError': 'فشل تحميل تقارير الأخطاء.',
      'adminBugs.categoryUi': 'واجهة المستخدم',
      'adminBugs.categoryFunctionality': 'وظائف',
      'adminBugs.categoryPerformance': 'أداء',
      'adminBugs.categorySubmission': 'تسليم',
      'adminBugs.categoryOther': 'أخرى',

      // Errors & Messages
      'error.loadFailed': 'فشل تحميل البيانات. يرجى تحديث الصفحة',
      'error.loginFailed': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'error.submissionFailed': 'فشل الإرسال. يرجى المحاولة مرة أخرى',
      'error.sessionExpired': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى',
      'success.sessionAdded': 'تمت إضافة المحاضره بنجاح! 🎉',
      'success.sessionUpdated': 'تم تحديث المحاضره بنجاح! ✏️',
      'success.sessionDeleted': 'تم حذف المحاضره بنجاح! 🗑️',
      'success.statusUpdated': 'تم تحديث المحاضره بنجاح! ✅',
      'success.submissionSuccess': 'تم إرسال التكليف بنجاح! 🎉',
    },
    en: {
      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.search': 'Search',
      'common.add': 'Add',
      'common.submit': 'Submit',
      'common.back': 'Back',
      'common.close': 'Close',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.viewAll': 'View All',
      'common.openLink': 'Open Link',
      'common.download': 'Download',
      'common.clear': 'Clear',
      'common.saving': 'Saving',
      'common.update': 'Update',

      // Auth
      'auth.welcomeBack': 'Codik Academy',
      'auth.signIn': 'Sign in',
      'auth.signingIn': 'Signing in...',
      'auth.email': 'Email address',
      'auth.password': 'Password',
      'auth.emailPlaceholder': 'student@example.com',
      'auth.passwordPlaceholder': '••••••••',
      'auth.loginSubtitle': 'Sign in to access your learning workspace',
      'auth.emailError': 'Please enter a valid email',
      'auth.passwordError': 'Password must be at least 6 characters',
      'auth.signOut': 'Sign Out',

      // Dashboard
      'dashboard.welcome': 'Welcome back',
      'dashboard.subtitle': 'Keep learning and build amazing things',
      'dashboard.courseProgress': 'Course Progress',
      'dashboard.keepGoing': 'Keep going!',
      'dashboard.sessionsAttended': 'Sessions Attended',
      'dashboard.goodJob': 'Good job!',
      'dashboard.assignmentsCompleted': 'Assignments Completed',
      'dashboard.excellent': 'Excellent!',
      'dashboard.overallScore': 'Overall Score',
      'dashboard.nice': 'Nice!',
      'dashboard.continueLearning': 'Continue Learning',
      'dashboard.recordedOn': 'Recorded on',
      'dashboard.watchSession': 'Watch Session',
      'dashboard.viewMaterials': 'View Materials',
      'dashboard.latestAssignment': 'Latest Assignment',
      'dashboard.dueIn': 'Due in',
      'dashboard.days': 'days',
      'dashboard.due': 'Due',
      'dashboard.startAssignment': 'Start Assignment',
      'dashboard.recentAnnouncements': 'Recent Announcements',
      'dashboard.allSessions': 'All Sessions',
      'dashboard.session': 'Session',
      'dashboard.submitPR': 'Submit PR',
      'dashboard.submitted': 'Submitted',
      'dashboard.pending': 'Pending',
      'dashboard.accepted': 'Accepted',
      'dashboard.needsRework': 'Needs Rework',
      'dashboard.githubLink': 'GitHub Link',
      'dashboard.viewFeedback': 'View Feedback',
      'dashboard.nextSession': 'Next Session',
      'dashboard.viewSchedule': 'View Schedule',
      'dashboard.progressOverview': 'Progress Overview',

      // Admin
      'admin.sessions': 'Sessions',
      'admin.searchSessions': 'Search sessions...',
      'admin.addSession': 'Add Session',
      'admin.editSession': 'Edit Session',
      'admin.title': 'Title',
      'admin.description': 'Description',
      'admin.orderIndex': 'Order',
      'admin.status': 'Status',
      'admin.studentStatus': 'Student Status',
      'admin.recordedDate': 'Recorded Date',
      'admin.duration': 'Duration',
      'admin.hours': 'hours',
      'admin.minutes': 'minutes',
      'admin.recordingLink': 'Recording Link',
      'admin.slideLink': 'Slide Link',
      'admin.assetsLink': 'Assets Link',
      'admin.assignmentTitle': 'Assignment Title',
      'admin.assignmentDescription': 'Assignment Description',
      'admin.assignmentDueDate': 'Due Date',
      'admin.draft': 'Draft',
      'admin.published': 'Published',
      'admin.upcoming': 'Upcoming',
      'admin.inProgress': 'In Progress',
      'admin.completed': 'Completed',
      'admin.actions': 'Actions',
      'admin.deleteConfirm': 'Are you sure you want to delete this session? This action cannot be undone.',
      'admin.totalSessions': 'Total Sessions',
      'admin.totalSubmissions': 'Total Submissions',
      'admin.pendingReviews': 'Pending Reviews',
      'admin.submissions': 'Submissions',
      'admin.student': 'Student',
      'admin.task': 'Task',
      'admin.submittedAt': 'Submitted At',
      'admin.prLink': 'PR Link',
      'admin.feedback': 'Feedback',
      'admin.accept': 'Accept',
      'admin.reject': 'Reject',
      'admin.writeFeedback': 'Write your feedback here...',
      'admin.noSubmissions': 'No submissions yet',
      'admin.statistics': 'Statistics',
      'admin.overview': 'Overview',
      'admin.dashboardOverview': 'Overview',
      'admin.welcomeMessage': 'Welcome back',
      'admin.quickActions': 'Quick Actions',
      'admin.addNewSession': 'Add New Session',
      'admin.addNewSessionDesc': 'Add a new session',
      'admin.reviewSubmissions': 'Review Submissions',
      'admin.reviewSubmissionsDesc': 'Review the submissions',
      'admin.studentSubmissions': 'Student Submissions',
      'admin.studentSubmissionsDesc': 'The student submissions',
      'admin.loadingSubmissions': 'Loading',
      'admin.noSubmissionsWaiting': 'No submissions waiting',
      'admin.viewCode': 'View Code',
      'admin.evaluate': 'Evaluate',
      'admin.sessionOrder': 'Session Order',
      'admin.adminStatus': 'Admin Status',
      'admin.studentState': 'Student State',
      'admin.sessionDuration': 'Session Duration',
      'admin.recordingLinkLabel': 'Recording Link',
      'admin.resourcesLinks': 'Resources',
      'admin.assignmentDetails': 'Assignment Details',
      'admin.saveSession': 'Save Session',
      'admin.updateSession': 'Update Session',
      'admin.orderError': 'Order error',
      'admin.dateError': 'Date error',
      'admin.dueDateError': 'Due date error',

      // Session Details
      'session.details': 'Session Details',
      'session.materials': 'Materials',
      'session.recording': 'Recording',
      'session.slides': 'Slides',
      'session.assets': 'Assets',
      'session.assignment': 'Assignment',
      'session.submitAssignment': 'Submit Assignment',
      'session.githubLinkPlaceholder': 'https://github.com/username/repo/pull/123',
      'session.submitting': 'Submitting...',
      'session.successMessage': 'Assignment submitted successfully! 🎉',
      'session.githubLinkRequired': 'Valid GitHub link required',
      'session.watchOnOneDrive': 'Watch on OneDrive',
      'session.openPresentation': 'Open Presentation',
      'session.downloadFiles': 'Download Files',
      'session.openSlides': 'Open Slides',
      'session.requiredTask': 'The required task',
      'session.viewTask': 'View the task',
      'session.noAssignment': 'No assignments for this session 🎉',
      'session.pastePRLink': 'Paste your Pull Request link from GitHub',
      'session.updateBeforeDeadline': 'You can update your solution before the deadline.',
      'session.breadcrumbSessions': 'Sessions',

      // Sidebar
      'sidebar.dashboard': 'Dashboard',
      'sidebar.sessions': 'Sessions',
      'sidebar.myProgress': 'My Progress',
      'sidebar.support': 'Support',
      'sidebar.adminPanel': 'Admin Panel',
      'sidebar.manageSubmissions': 'Manage Submissions',
      'sidebar.settings': 'Settings',
      'sidebar.assignments': 'Assignments',
      'sidebar.attendance': 'Attendance',
      'sidebar.profile': 'Profile',
      'sidebar.studentRole': 'The role',
      'sidebar.bootcampName': 'The name',

      // Sidebar - new
      'sidebar.myCourse': 'My Course',

      // Course page
      'course.recordingAvailable': 'Recording Available',
      'course.resources': 'Resources',
      'course.openSession': 'Open Session',
      'course.watchRecording': 'Watch Recording',
      'course.openSlides': 'Open Slides',
      'course.downloadResources': 'Download Resources',
      'course.submitAssignment': 'Submit Assignment',

      // Dashboard - new
      'dashboard.currentAssignment': 'Current Assignment',
      'dashboard.waitingReview': 'Waiting Review',
      'dashboard.notSubmitted': 'Not Submitted',
      'dashboard.noAssignment': 'No assignments',
      'dashboard.upcomingSession': 'Upcoming Session',
      'dashboard.noUpcoming': 'No upcoming sessions',
      'dashboard.allCompleted': 'You completed all sessions',
      'dashboard.viewSession': 'View Session',
      'dashboard.timeRemaining': 'Time Remaining',
      'dashboard.hours': 'Hours',
      'dashboard.minutes': 'Minutes',
      'dashboard.seconds': 'Seconds',
      'dashboard.deadlinePassed': 'Deadline has passed',
      'dashboard.lateSubmission': 'Please submit as soon as possible',

      // Submission
      'submission.repoUrl': 'Repository URL',
      'submission.prUrl': 'Pull Request URL',
      'submission.optional': 'optional',
      'submission.status': 'Submission Status',
      'submission.submissionDate': 'Submission Date',
      'submission.lastUpdate': 'Last Update',

      // Profile
      'profile.subtitle': 'Your personal info and stats',

      // Progress
      'progress.subtitle': 'Track your course progress',
      'progress.tasksCompleted': 'tasks completed',
      'progress.sessionBreakdown': 'Session Breakdown',

      // Sessions Sidebar
      'sessions.bootcampBatch': 'Java Spring Bootcamp - Batch 5',

      // Admin Sidebar
      'admin.brandName': 'CodeCampus',
      'admin.adminLabel': 'ADMIN',
      'admin.dashboard': 'Dashboard',
      'admin.bootcamps': 'Bootcamps',
      'admin.assignments': 'Assignments',
      'admin.students': 'Students',
      'admin.superAdmin': 'Super Admin',

      // Language
      'lang.switchLanguage': 'العربية',
      'lang.arabic': 'العربية',
      'lang.english': 'English',

      // Bug Report
      'bugReport.title': 'Report a Bug',
      'bugReport.subtitle': 'Help us improve by reporting issues',
      'bugReport.tooltip': 'Report a Bug',
      'bugReport.category': 'Category',
      'bugReport.bugTitle': 'Bug Title',
      'bugReport.description': 'Description',
      'bugReport.titlePlaceholder': 'Brief description of the issue',
      'bugReport.descriptionPlaceholder': 'Please describe the bug in detail. What did you expect to happen? What actually happened?',
      'bugReport.categoryUi': 'UI / Visual Issue',
      'bugReport.categoryFunctionality': 'Functionality Bug',
      'bugReport.categoryPerformance': 'Performance Issue',
      'bugReport.categorySubmission': 'Submission Problem',
      'bugReport.categoryOther': 'Other',
      'bugReport.reportingAs': 'Reporting as:',
      'bugReport.submitReport': 'Submit Report',
      'bugReport.submitting': 'Submitting...',
      'bugReport.successTitle': 'Bug report submitted!',
      'bugReport.successMessage': 'Thank you for helping us improve.',
      'bugReport.errorMessage': 'Failed to submit bug report. Please try again.',

      // Admin Bug Reports
      'adminBugs.title': 'Bug Reports',
      'adminBugs.subtitle': 'View and manage reported bugs',
      'adminBugs.refresh': 'Refresh',
      'adminBugs.open': 'Open',
      'adminBugs.inProgress': 'In Progress',
      'adminBugs.resolved': 'Resolved',
      'adminBugs.closed': 'Closed',
      'adminBugs.searchPlaceholder': 'Search bug reports...',
      'adminBugs.allStatus': 'All Status',
      'adminBugs.loading': 'Loading bug reports...',
      'adminBugs.noReports': 'No bug reports found',
      'adminBugs.noReportsDesc': 'All clear! No bugs have been reported yet.',
      'adminBugs.bug': 'Bug',
      'adminBugs.category': 'Category',
      'adminBugs.reporter': 'Reporter',
      'adminBugs.status': 'Status',
      'adminBugs.date': 'Date',
      'adminBugs.actions': 'Actions',
      'adminBugs.markInProgress': 'Mark In Progress',
      'adminBugs.markResolved': 'Mark Resolved',
      'adminBugs.close': 'Close',
      'adminBugs.reopen': 'Reopen',
      'adminBugs.delete': 'Delete',
      'adminBugs.deleteConfirm': 'Are you sure you want to delete this bug report?',
      'adminBugs.details': 'Bug Report Details',
      'adminBugs.description': 'Description',
      'adminBugs.reportedBy': 'Reported By',
      'adminBugs.reportedOn': 'Reported On',
      'adminBugs.updateStatus': 'Update Status',
      'adminBugs.deleteReport': 'Delete Report',
      'adminBugs.sidebarLabel': 'Bug Reports',
      'adminBugs.loadError': 'Failed to load bug reports.',
      'adminBugs.categoryUi': 'UI / Visual',
      'adminBugs.categoryFunctionality': 'Functionality',
      'adminBugs.categoryPerformance': 'Performance',
      'adminBugs.categorySubmission': 'Submission',
      'adminBugs.categoryOther': 'Other',

      // Errors & Messages
      'error.loadFailed': 'Failed to load data. Please refresh the page',
      'error.loginFailed': 'Invalid email or password',
      'error.submissionFailed': 'Failed to submit. Please try again',
      'error.sessionExpired': 'Your session has expired. Please login again',
      'success.sessionAdded': 'Session added successfully! 🎉',
      'success.sessionUpdated': 'Session updated successfully! ✏️',
      'success.sessionDeleted': 'Session deleted successfully! 🗑️',
      'success.statusUpdated': 'Status updated successfully! ✅',
      'success.submissionSuccess': 'Assignment submitted successfully! 🎉',
    }
  };

  constructor() {
    // Load saved language or default to Arabic
    const savedLang = localStorage.getItem('app-language') as Language;
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      this.currentLang.set(savedLang);
    }
    this.applyLanguageToDocument();
  }

  get lang() {
    return this.currentLang.asReadonly();
  }

  get isRTL(): boolean {
    return this.currentLang() === 'ar';
  }

  t(key: keyof TranslationKeys): string {
    return this.translations[this.currentLang()][key];
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    localStorage.setItem('app-language', lang);
    this.applyLanguageToDocument();
  }

  toggleLanguage(): void {
    const newLang: Language = this.currentLang() === 'ar' ? 'en' : 'ar';
    this.setLanguage(newLang);
  }

  private applyLanguageToDocument(): void {
    const html = document.documentElement;
    const lang = this.currentLang();

    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    if (lang === 'ar') {
      html.classList.add('rtl');
      html.classList.remove('ltr');
    } else {
      html.classList.add('ltr');
      html.classList.remove('rtl');
    }
  }
}
