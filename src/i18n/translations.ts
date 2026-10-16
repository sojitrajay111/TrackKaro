export type Lang = "en" | "hi" | "gu";

export interface Translations {
  // Brand & Shell
  appName: string;
  tagline: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcomeBack: string;

  // Navigation Pill Tabs
  navOverview: string;
  navExpenses: string;
  navKhata: string;
  navGroups: string;
  navDeals: string;
  navSettings: string;

  // Header & Controls
  settings: string;
  notifications: string;
  signOut: string;
  signIn: string;
  signUp: string;
  switchTheme: string;
  switchLanguage: string;

  // Metrics Bar
  totalBalance: string;
  monthlySpent: string;
  netKhata: string;
  willGet: string;
  willGive: string;
  budgetUtilization: string;
  activeGroups: string;
  activeReminders: string;

  // Bento Widgets
  spendingTrendTitle: string;
  spendingTrendSubtitle: string;
  budgetGaugeTitle: string;
  budgetGaugeSubtitle: string;
  daysRemaining: string;
  utilized: string;
  khataSnapshotTitle: string;
  topCustomer: string;
  settleUp: string;
  viewLedger: string;
  weeklyAgendaTitle: string;
  todaySchedule: string;
  upcomingRemindersTitle: string;
  dueSoon: string;
  markPaid: string;
  tasksCompleted: string;

  // Categories
  catFood: string;
  catShopping: string;
  catGroceries: string;
  catBills: string;
  catTravel: string;
  catEntertainment: string;
  catOther: string;

  // Actions
  addExpense: string;
  addKhata: string;
  createGroup: string;
  exploreDeals: string;
  viewAll: string;
}

export const translations: Record<Lang, Translations> = {
  en: {
    appName: "TrackKaro",
    tagline: "Track smart. Save more.",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    welcomeBack: "Welcome back",

    navOverview: "Overview",
    navExpenses: "Spending",
    navKhata: "Bahi Khata",
    navGroups: "Groups",
    navDeals: "Deals",
    navSettings: "Settings",

    settings: "Settings",
    notifications: "Notifications",
    signOut: "Sign Out",
    signIn: "Sign In",
    signUp: "Sign Up",
    switchTheme: "Toggle theme",
    switchLanguage: "Language",

    totalBalance: "Net Balance",
    monthlySpent: "Month Spent",
    netKhata: "Net Khata",
    willGet: "You Will Get",
    willGive: "You Will Give",
    budgetUtilization: "Budget Used",
    activeGroups: "Groups",
    activeReminders: "Pending Bills",

    spendingTrendTitle: "7-Day Spending",
    spendingTrendSubtitle: "Daily expense trend",
    budgetGaugeTitle: "Monthly Budget",
    budgetGaugeSubtitle: "Safe limit indicator",
    daysRemaining: "days left in month",
    utilized: "utilized",
    khataSnapshotTitle: "Khata Snapshot",
    topCustomer: "Recent Contact",
    settleUp: "Settle Up",
    viewLedger: "Full Ledger",
    weeklyAgendaTitle: "Weekly Calendar & Bills",
    todaySchedule: "Scheduled payments",
    upcomingRemindersTitle: "Impending Dues & Tasks",
    dueSoon: "Due Soon",
    markPaid: "Mark Paid",
    tasksCompleted: "completed",

    catFood: "Food & Dining",
    catShopping: "Shopping",
    catGroceries: "Groceries",
    catBills: "Utility Bills",
    catTravel: "Travel & Fuel",
    catEntertainment: "Entertainment",
    catOther: "Other",

    addExpense: "Add Expense",
    addKhata: "New Khata Entry",
    createGroup: "Create Group",
    exploreDeals: "Smart Deals",
    viewAll: "View all",
  },
  hi: {
    appName: "TrackKaro",
    tagline: "स्मार्ट ट्रैक करें। ज्यादा बचाएं।",
    goodMorning: "शुभ प्रभात",
    goodAfternoon: "शुभ दोपहर",
    goodEvening: "शुभ संध्या",
    welcomeBack: "स्वागत है",

    navOverview: "अवलोकन",
    navExpenses: "खर्च",
    navKhata: "बही खाता",
    navGroups: "ग्रुप्स",
    navDeals: "डील्स",
    navSettings: "सेटिंग्स",

    settings: "सेटिंग्स",
    notifications: "सूचनाएं",
    signOut: "लॉग आउट",
    signIn: "लॉग इन",
    signUp: "साइन अप",
    switchTheme: "थीम बदलें",
    switchLanguage: "भाषा",

    totalBalance: "कुल बैलेंस",
    monthlySpent: "मासिक खर्च",
    netKhata: "नेट खाता",
    willGet: "पैसे मिलेंगे",
    willGive: "पैसे देने हैं",
    budgetUtilization: "बजट इस्तेमाल",
    activeGroups: "सक्रिय ग्रुप्स",
    activeReminders: "लंबित बिल",

    spendingTrendTitle: "7-दिन का खर्च",
    spendingTrendSubtitle: "दैनिक खर्च का रुझान",
    budgetGaugeTitle: "मासिक बजट",
    budgetGaugeSubtitle: "सुरक्षित खर्च सीमा",
    daysRemaining: "महीने में शेष दिन",
    utilized: "इस्तेमाल हुआ",
    khataSnapshotTitle: "खाता सारांश",
    topCustomer: "हाल का संपर्क",
    settleUp: "हिसाब चुकता करें",
    viewLedger: "पूरा खाता",
    weeklyAgendaTitle: "साप्ताहिक कैलेंडर और बिल",
    todaySchedule: "नियत भुगतान",
    upcomingRemindersTitle: "आगामी बिल और कार्य",
    dueSoon: "जल्द देय",
    markPaid: "भुगतान किया",
    tasksCompleted: "पूरे हुए",

    catFood: "खाना और डाइनिंग",
    catShopping: "शॉपिंग",
    catGroceries: "किराना",
    catBills: "बिल और रीचार्ज",
    catTravel: "यात्रा और पेट्रोल",
    catEntertainment: "मनोरंजन",
    catOther: "अन्य",

    addExpense: "खर्च जोड़ें",
    addKhata: "नया खाता",
    createGroup: "ग्रुप बनाएं",
    exploreDeals: "स्मार्ट डील्स",
    viewAll: "सभी देखें",
  },
  gu: {
    appName: "TrackKaro",
    tagline: "સ્માર્ટ ટ્રેકિંગ. વધુ બચત.",
    goodMorning: "સુપ્રભાત",
    goodAfternoon: "શુભ બપોર",
    goodEvening: "શુભ સાંજ",
    welcomeBack: "સ્વાગત છે",

    navOverview: "વિહંગાવલોકન",
    navExpenses: "ખર્ચ",
    navKhata: "ખાતાવહી",
    navGroups: "ગ્રૂપ્સ",
    navDeals: "ડીલ્સ",
    navSettings: "સેટિંગ્સ",

    settings: "સેટિંગ્સ",
    notifications: "સૂચનાઓ",
    signOut: "લૉગ આઉટ",
    signIn: "સાઇન ઇન",
    signUp: "સાઇન અપ",
    switchTheme: "થીમ બદલો",
    switchLanguage: "ભાષા",

    totalBalance: "કુલ બેલેન્સ",
    monthlySpent: "માસિક ખર્ચ",
    netKhata: "નેટ ખાતું",
    willGet: "મળવાના બાકી",
    willGive: "આપવાના બાકી",
    budgetUtilization: "વપરાયેલ બજેટ",
    activeGroups: "સક્રિય ગ્રૂપ",
    activeReminders: "બાકી બિલો",

    spendingTrendTitle: "7-દિવસનો ખર્ચ",
    spendingTrendSubtitle: "દૈનિક ખર્ચ પ્રવાહ",
    budgetGaugeTitle: "માસિક બજેટ",
    budgetGaugeSubtitle: "સુરક્ષિત મર્યાદા",
    daysRemaining: "મહિનામાં બાકી દિવસો",
    utilized: "વપરાયું",
    khataSnapshotTitle: "ખાતા સારાંશ",
    topCustomer: "તાજેતરનો સંપર્ક",
    settleUp: "હિસાબ પતાવો",
    viewLedger: "સંપૂર્ણ ખાતાવહી",
    weeklyAgendaTitle: "સાપ્તાહિક કેલેન્ડર અને બિલ",
    todaySchedule: "નિયત ચુકવણીઓ",
    upcomingRemindersTitle: "આગામી બિલો અને કાર્યો",
    dueSoon: "નજીકની તારીખ",
    markPaid: "ચૂકવાઈ ગયું",
    tasksCompleted: "પૂર્ણ થયા",

    catFood: "ખોરાક અને ભોજન",
    catShopping: "શોપિંગ",
    catGroceries: "કરિયાણું",
    catBills: "બિલ અને રિચાર્જ",
    catTravel: "મુસાફરી અને ઇંધણ",
    catEntertainment: "મનોરંજન",
    catOther: "અન્ય",

    addExpense: "ખર્ચ ઉમેરો",
    addKhata: "નવી ખાતા એન્ટ્રી",
    createGroup: "ગ્રૂપ બનાવો",
    exploreDeals: "સ્માર્ટ ડીલ્સ",
    viewAll: "બધા જુઓ",
  },
};
