/**
 * Auto-extracted reference data from undp_pfi_hcc (10)(1).html
 */

export interface PartnerLogoInfo {
  id: string;
  name: string;
  role: string;
  title: string;
  logoUrl: string;
  position: 'right' | 'left' | 'footer';
}

export interface ClusterMemberSeed {
  id: string;
  name: string;
  owner: string;
}

export interface ClusterSeed {
  id: string;
  name: string;
  sector: string;
  unionName: string;
  governorate: string;
  hostEnterprise: string;
  hostOwner: string;
  hostPhone: string;
  centralStations: string;
  members: ClusterMemberSeed[];
}

export interface ProductTierSeed {
  label: string;
  minQty: number;
  priceUsd: number;
  discountTag: string;
}

export interface ProductSeed {
  id: string;
  title: string;
  sector: string;
  prodScope: 'SINGLE' | 'INTEGRATED';
  scopeBadge: string;
  clusterId: string;
  clusterName: string;
  enterpriseName: string;
  enterpriseOwner: string;
  enterprisePhone: string;
  unionName: string;
  priceUsd: number;
  unit: string;
  dailyCapacity: string;
  sampleAvailable: boolean;
  image: string;
  priceSavingHighlight: string;
  qualityEdgeHighlight: string;
  description: string;
  manufacturingSpecs: string;
  tiers: ProductTierSeed[];
}

export const OFFICIAL_PROJECT_NAME = 'مشروع الدعم العاجل لتعافي المنشآت الصناعية في غزة من خلال الوحدات الإنتاجية العنقودية';

export const DEFAULT_INTRO_TEXT = 'يهدف المشروع إلى دعم تعافي المنشآت الصناعية في قطاع غزة من خلال تجمعات إنتاجية تتعاون في التصنيع وتستفيد من محطات إنتاج مشتركة. وتتيح المنصة للمؤسسات والشركات استكشاف المنتجات المحلية ومواصفاتها وطلب عروض أسعار من داخل الموقع';

export const INITIAL_PARTNERS: PartnerLogoInfo[] = [
  {
    id: 'partner-norway-mfa',
    name: 'وزارة الخارجية النرويجية (Norwegian MFA)',
    role: 'تمويل',
    title: 'تمويل: وزارة الخارجية النرويجية (Norwegian MFA)',
    logoUrl: '/uploads/extracted/partner-logo-1.png',
    position: 'right'
  },
  {
    id: 'partner-mone',
    name: 'وزارة الاقتصاد الوطني',
    role: 'إشراف',
    title: 'إشراف: وزارة الاقتصاد الوطني',
    logoUrl: '/uploads/extracted/partner-logo-2.png',
    position: 'right'
  },
  {
    id: 'partner-pfi',
    name: 'الاتحاد العام للصناعات الفلسطينية (PFI)',
    role: 'تنفيذ',
    title: 'تنفيذ: الاتحاد العام للصناعات الفلسطينية (PFI)',
    logoUrl: '/uploads/extracted/partner-logo-3.png',
    position: 'right'
  },
  {
    id: 'partner-undp',
    name: 'برنامج الأمم المتحدة الإنمائي (UNDP)',
    role: 'بالشراكة مع',
    title: 'بالشراكة مع: برنامج الأمم المتحدة الإنمائي (UNDP)',
    logoUrl: '/uploads/extracted/partner-logo-4.png',
    position: 'right'
  },
  {
    id: 'partner-hcc',
    name: 'شركة محمد حسن حلاوة وشركائه للاستشارات والتحول المؤسسي - HCC',
    role: 'الاستشاري المطور',
    title: 'الاستشاري المطور: شركة محمد حسن حلاوة وشركائه للاستشارات والتحول المؤسسي - HCC',
    logoUrl: '/uploads/extracted/partner-logo-5.png',
    position: 'left'
  },
  {
    id: 'partner-hcc-footer',
    name: 'شركة محمد حسن حلاوة وشركائه للاستشارات والتحول المؤسسي - HCC',
    role: 'الاستشاري المطور',
    title: 'شركة محمد حسن حلاوة وشركائه للاستشارات والتحول المؤسسي - HCC',
    logoUrl: '/uploads/extracted/partner-logo-6.png',
    position: 'footer'
  }
];

export const INITIAL_CLUSTERS_DB: ClusterSeed[] = [
  {
    "id": "CL1",
    "name": "تجمع شركة عون أحمد طه وشركاه",
    "sector": "الخياطة والنسيج",
    "unionName": "اتحاد صناعات الملابس والنسيج",
    "governorate": "غزة – حي النصر – دوار الشباب والرياضة",
    "hostEnterprise": "شركة عون أحمد طه وشركاه",
    "hostOwner": "علي حسن أحمد طه",
    "hostPhone": "0599950364",
    "centralStations": "محطة القص الكهربائي المركزي + ماكينة العراوي الأوتوماتيكية + ماكينة الأزرار + منظومة الكي البخاري المركزي",
    "members": [
      {
        "id": "HOST-CL1",
        "name": "شركة عون أحمد طه وشركاه",
        "owner": "علي حسن أحمد طه"
      },
      {
        "id": "F01",
        "name": "شركة الزهراء للصناعة والتجارة",
        "owner": "شحدة مصطفى عودة"
      },
      {
        "id": "F02",
        "name": "مصنع ألما كلوز للملابس",
        "owner": "محمود صالح العوضي"
      },
      {
        "id": "F03",
        "name": "مصنع وليد صالحة للخياطة",
        "owner": "وليد فارس صالحة"
      },
      {
        "id": "F04",
        "name": "شركة عايش للتجارة والصناعة",
        "owner": "بسام محمد عايش"
      },
      {
        "id": "F05",
        "name": "شركة جمال التوم للخياطة",
        "owner": "وسام جمال التوم"
      },
      {
        "id": "F06",
        "name": "منشأة إبراهيم شلحة للخياطة",
        "owner": "إبراهيم محمد شلحة"
      },
      {
        "id": "F07",
        "name": "شركة صابر صالح للتجارة",
        "owner": "صابر صالح"
      }
    ]
  },
  {
    "id": "CL2",
    "name": "تجمع مشغل المنال النسائي",
    "sector": "مجلس سيدات الأعمال",
    "unionName": "مجلس سيدات الأعمال",
    "governorate": "الوسطى – دير البلح",
    "hostEnterprise": "مشغل المنال",
    "hostOwner": "عزيزة مصطفى مصبح",
    "hostPhone": "0599992287",
    "centralStations": "محطة القص والتفصيل المركزي وماكينات التطريز والتشطيب النسائي",
    "members": [
      {
        "id": "HOST-CL2",
        "name": "مشغل المنال",
        "owner": "عزيزة مصطفى مصبح"
      },
      {
        "id": "F08",
        "name": "لمسة نسائية للتطريز الفلسطيني",
        "owner": "رندا محمود الطلاع"
      },
      {
        "id": "F09",
        "name": "منشأة نجوى للخياطة والتفصيل",
        "owner": "نجوى سلامة أبو زايد"
      },
      {
        "id": "F10",
        "name": "بيت الأناقة للأزياء والخياطة",
        "owner": "إسراء أيمن الخباز"
      },
      {
        "id": "F11",
        "name": "منشأة ندى سعيد للخياطة",
        "owner": "ندى إسماعيل النعامي"
      }
    ]
  },
  {
    "id": "CL3",
    "name": "تجمع جلاكسي بلص لسيدات الأعمال",
    "sector": "مجلس سيدات الأعمال",
    "unionName": "مجلس سيدات الأعمال",
    "governorate": "خانيونس – عمارة جاسر",
    "hostEnterprise": "جلاكسي بلص للتدريب والإنتاج",
    "hostOwner": "محمد وحيد رستم",
    "hostPhone": "0598781636",
    "centralStations": "وحدة القص والتجهيز المركزي لحقائب الكرامة والمشغولات التراثية",
    "members": [
      {
        "id": "HOST-CL3",
        "name": "جلاكسي بلص",
        "owner": "محمد وحيد رستم"
      },
      {
        "id": "F12",
        "name": "ندى لتعليم الخياطة والتفصيل",
        "owner": "ابتسام موسى أبو السعود"
      },
      {
        "id": "F13",
        "name": "أزياء العلا للخياطة",
        "owner": "رغدة حسن أبو عجاج"
      },
      {
        "id": "F14",
        "name": "منشأة تحرير للخياطة والكروشيه",
        "owner": "تحرير عصام أبو مصطفى"
      },
      {
        "id": "F15",
        "name": "مشغل ريم أبو جامع للمنسوجات",
        "owner": "ريم سامي أبو جامع"
      }
    ]
  },
  {
    "id": "CL4",
    "name": "تجمع مشغل إيمان النسائي",
    "sector": "مجلس سيدات الأعمال",
    "unionName": "مجلس سيدات الأعمال",
    "governorate": "غزة – شارع الثورة",
    "hostEnterprise": "مشغل إيمان سهيل الشمالي",
    "hostOwner": "إيمان سهيل الشمالي",
    "hostPhone": "0594994121",
    "centralStations": "وحدة التفصيل والحبكة والكي للمنسوجات والزي المدرسي",
    "members": [
      {
        "id": "F16",
        "name": "مشغل إيمان للمنسوجات",
        "owner": "إيمان سهيل الشمالي"
      }
    ]
  },
  {
    "id": "CL5",
    "name": "تجمع شركة فيرونا الحديثة للرخام",
    "sector": "الصناعات الإنشائية والرخام",
    "unionName": "اتحاد الصناعات الإنشائية",
    "governorate": "غزة – السدرة – موقف جباليا",
    "hostEnterprise": "شركة فيرونا الحديثة للرخام",
    "hostOwner": "مازن رشيد الشوا",
    "hostPhone": "0599770679",
    "centralStations": "مناشير القص الرئيسية للرخام والجرانيت + محطة الجلي والتلميع المركزية + كسارة تدوير الركام",
    "members": [
      {
        "id": "HOST-CL5",
        "name": "شركة فيرونا الحديثة للرخام",
        "owner": "مازن رشيد الشوا"
      },
      {
        "id": "F17",
        "name": "مصنع إبراهيم اخليل للرخام",
        "owner": "إبراهيم ناصر اخليل"
      },
      {
        "id": "F18",
        "name": "مصنع العف للرخام والجرانيت",
        "owner": "إبراهيم كمال العف"
      },
      {
        "id": "F19",
        "name": "مصنع محمد الشامي للرخام",
        "owner": "محمد علي الشامي"
      }
    ]
  },
  {
    "id": "CL6",
    "name": "تجمع مصنع المدهون للرخام",
    "sector": "الصناعات الإنشائية والرخام",
    "unionName": "اتحاد الصناعات الإنشائية",
    "governorate": "غزة – حي الدرج",
    "hostEnterprise": "مصنع المدهون للرخام والجرانيت",
    "hostOwner": "سعدو محمود المدهون",
    "hostPhone": "0599106107",
    "centralStations": "منشار القص الجسري المركزي + ماكينة الحفر والتشكيل المائي للرخام والحجر",
    "members": [
      {
        "id": "HOST-CL6",
        "name": "مصنع المدهون للرخام والجرانيت",
        "owner": "سعدو محمود المدهون"
      },
      {
        "id": "F20",
        "name": "شركة أونكس ستون للرخام",
        "owner": "سامي محمد الدريملي"
      },
      {
        "id": "F21",
        "name": "مصنع اليازجي للرخام والجرانيت",
        "owner": "محمد عون اليازجي"
      },
      {
        "id": "F22",
        "name": "مصنع مهند المدهون للرخام",
        "owner": "مهند عاطف المدهون"
      }
    ]
  },
  {
    "id": "CL7",
    "name": "تجمع الجعيدي للصناعات الخشبية",
    "sector": "الصناعات الخشبية والأثاث",
    "unionName": "اتحاد الصناعات الخشبية والأثاث",
    "governorate": "غزة – الشاطئ – شارع حميد",
    "hostEnterprise": "منشأة محمد الجعيدي للأخشاب",
    "hostOwner": "محمد عبد القادر الجعيدي",
    "hostPhone": "0597015592",
    "centralStations": "منشار الصينية المركزي (Panel Saw) + ماكينة لصق الحواف الأوتوماتيكية + مكبس حراري",
    "members": [
      {
        "id": "HOST-CL7",
        "name": "منشأة محمد الجعيدي للأخشاب",
        "owner": "محمد عبد القادر الجعيدي"
      },
      {
        "id": "F28",
        "name": "شركة عيسى مهنا للأخشاب",
        "owner": "أحمد عيسى مهنا"
      },
      {
        "id": "F29",
        "name": "منجرة إياد أبو حصيرة للأثاث",
        "owner": "إياد نصر الدين أبو حصيرة"
      },
      {
        "id": "F30",
        "name": "منشأة محمد زيدان للموبيليا",
        "owner": "محمد إبراهيم زيدان"
      }
    ]
  },
  {
    "id": "CL8",
    "name": "تجمع شركة البيت الملكي للأخشاب",
    "sector": "الصناعات الخشبية والأثاث",
    "unionName": "اتحاد الصناعات الخشبية والأثاث",
    "governorate": "غزة – شارع الثلاثيني",
    "hostEnterprise": "شركة البيت الملكي للأثاث",
    "hostOwner": "رامي منير الأسي",
    "hostPhone": "0599995116",
    "centralStations": "محطة التفصيل والرابو المركزي + غرفة الدهان والرش المركزية",
    "members": [
      {
        "id": "HOST-CL8",
        "name": "شركة البيت الملكي للأثاث",
        "owner": "رامي منير الأسي"
      },
      {
        "id": "F31",
        "name": "منجرة محمود أبو حصيرة",
        "owner": "محمود عبد الحميد أبو حصيرة"
      },
      {
        "id": "F32",
        "name": "منجرة عيد للأخشاب والموبيليا",
        "owner": "هاني أكرم عيد"
      }
    ]
  },
  {
    "id": "CL9",
    "name": "تجمع شركة الرزي للأخشاب (الوسطى)",
    "sector": "الصناعات الخشبية والأثاث",
    "unionName": "اتحاد الصناعات الخشبية والأثاث",
    "governorate": "الوسطى – النصيرات",
    "hostEnterprise": "شركة الرزي للمقاولات والأخشاب",
    "hostOwner": "خضر محمود الرزي",
    "hostPhone": "0599407465",
    "centralStations": "محطة القص والتشكيل المركزي لأثاث الإيواء والمدارس",
    "members": [
      {
        "id": "HOST-CL9",
        "name": "شركة الرزي للأخشاب",
        "owner": "خضر محمود الرزي"
      },
      {
        "id": "F33",
        "name": "شركة كمال السعافين للموبيليا",
        "owner": "كمال الدين السعافين"
      }
    ]
  },
  {
    "id": "CL10",
    "name": "تجمع بصل وحسنات للصناعات المعدنية",
    "sector": "الصناعات المعدنية والهندسية",
    "unionName": "اتحاد الصناعات المعدنية والهندسية",
    "governorate": "غزة – عسقولة / حي الدرج",
    "hostEnterprise": "تجمع بصل وحسنات الهندسي",
    "hostOwner": "محمد بصل / حمدي حسنات",
    "hostPhone": "0597888585",
    "centralStations": "مقص الصاج الهيدروليكي المركزي + طعاجة الصاج المركزية + مخارط هندسية",
    "members": [
      {
        "id": "HOST-CL10",
        "name": "تجمع بصل وحسنات الهندسي",
        "owner": "محمد بصل / حمدي حسنات"
      },
      {
        "id": "F23",
        "name": "مصنع مشتهى للصناعات المعدنية",
        "owner": "أحمد أسامة مشتهى"
      },
      {
        "id": "F24",
        "name": "محددة أبناء حمودة للمعادن",
        "owner": "عطية فريد حمودة"
      }
    ]
  },
  {
    "id": "CL11",
    "name": "تجمع شركة أبو عماد سمور للمعادن",
    "sector": "الصناعات المعدنية والهندسية",
    "unionName": "اتحاد الصناعات المعدنية والهندسية",
    "governorate": "غزة – الصفطاوي",
    "hostEnterprise": "شركة أبو عماد سمور وأولاده",
    "hostOwner": "عصام أحمد سمور",
    "hostPhone": "0599018887",
    "centralStations": "محطة قص وتشكيل الهياكل المعدنية الثقيلة وشاسيهات الكرفانات",
    "members": [
      {
        "id": "F25",
        "name": "شركة أبو عماد سمور وأولاده",
        "owner": "عصام أحمد سمور"
      }
    ]
  },
  {
    "id": "CL12",
    "name": "تجمع ورشة أبو أسعد حسب الله للمعادن",
    "sector": "الصناعات المعدنية والهندسية",
    "unionName": "اتحاد الصناعات المعدنية والهندسية",
    "governorate": "غزة – شارع جولس",
    "hostEnterprise": "ورشة أبو أسعد حسب الله",
    "hostOwner": "جاسر أسعد حسب الله",
    "hostPhone": "0598233210",
    "centralStations": "وحدة اللحام الصناعي وتصنيع خزانات المياه المجلفنة والهياكل",
    "members": [
      {
        "id": "F26",
        "name": "ورشة أبو أسعد حسب الله",
        "owner": "جاسر أسعد حسب الله"
      }
    ]
  },
  {
    "id": "CL13",
    "name": "تجمع ورشة الاتحاد للحدادة الهندسية",
    "sector": "الصناعات المعدنية والهندسية",
    "unionName": "اتحاد الصناعات المعدنية والهندسية",
    "governorate": "غزة – الدرج – السدرة",
    "hostEnterprise": "ورشة الاتحاد للحدادة",
    "hostOwner": "جهاد كامل أبو جهل",
    "hostPhone": "0599773284",
    "centralStations": "محطة الحدادة الهندسية وتصنيع الأبواب المصفحة وحوامل الطاقة الشمسية",
    "members": [
      {
        "id": "F27",
        "name": "ورشة الاتحاد للحدادة",
        "owner": "جهاد كامل أبو جهل"
      }
    ]
  },
  {
    "id": "CL14",
    "name": "تجمع شركة أبو أشرف النعسان للألمنيوم",
    "sector": "صناعات الألمنيوم والزجاج",
    "unionName": "اتحاد صناعات الألمنيوم والزجاج",
    "governorate": "غزة – عسقولة",
    "hostEnterprise": "شركة أبو أشرف النعسان للألمنيوم",
    "hostOwner": "شعبان محمد النعسان",
    "hostPhone": "0599343636",
    "centralStations": "مقاصات الألمنيوم المزدوجة المركزية + مكابس التخريم والفرز المركزية",
    "members": [
      {
        "id": "HOST-CL14",
        "name": "شركة أبو أشرف النعسان للألمنيوم",
        "owner": "شعبان محمد النعسان"
      },
      {
        "id": "F34",
        "name": "شركة عياش لصناعة الألمنيوم",
        "owner": "مصطفى كامل عياش"
      },
      {
        "id": "F35",
        "name": "ورشة الرضا للألمنيوم",
        "owner": "شاهر نمر سالم"
      },
      {
        "id": "F36",
        "name": "منشأة محمد النعسان للألمنيوم",
        "owner": "محمد محمد النعسان"
      },
      {
        "id": "F37",
        "name": "ورشة حازم النعسان للألمنيوم",
        "owner": "حازم بسام النعسان"
      }
    ]
  },
  {
    "id": "CL15",
    "name": "تجمع شركة الجوهرة اللامعة للألمنيوم",
    "sector": "صناعات الألمنيوم والزجاج",
    "unionName": "اتحاد صناعات الألمنيوم والزجاج",
    "governorate": "غزة – النفق – شارع بورسعيد",
    "hostEnterprise": "شركة الجوهرة اللامعة (المظلوم)",
    "hostOwner": "يحيى بشير المظلوم",
    "hostPhone": "0599171027",
    "centralStations": "محطة القص المزدوج الدقيقة + مكبس زوايا الألمنيوم الهيدروليكي المركزي",
    "members": [
      {
        "id": "HOST-CL15",
        "name": "شركة الجوهرة اللامعة للألمنيوم",
        "owner": "يحيى بشير المظلوم"
      },
      {
        "id": "F38",
        "name": "ورشة العجلة للألمنيوم",
        "owner": "عمر صبحي العجلة"
      },
      {
        "id": "F39",
        "name": "شركة سميح أبو الخير وشركاه",
        "owner": "سميح رشدي أبو الخير"
      },
      {
        "id": "F40",
        "name": "ورشة الشهيد عليان أبو وادي",
        "owner": "مصطفى عطا أبو وادي"
      },
      {
        "id": "F41",
        "name": "منشأة أيمن شعبان للألمنيوم",
        "owner": "أيمن شعبان عبد الله"
      }
    ]
  }
];

export const INITIAL_PRODUCTS_DB: ProductSeed[] = [
  {
    "id": "PRD-101",
    "title": "طقم الملابس الشتوية المبطن للأطفال",
    "sector": "الخياطة والنسيج",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL1",
    "clusterName": "تجمع شركة عون أحمد طه وشركاه",
    "enterpriseName": "مصنع ألما كلوز للملابس",
    "enterpriseOwner": "محمود صالح العوضي",
    "enterprisePhone": "0599299292",
    "unionName": "اتحاد صناعات الملابس والنسيج",
    "priceUsd": 12.5,
    "unit": "طقم شتوي",
    "dailyCapacity": "450 طقم / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-101.jpg",
    "priceSavingHighlight": "وفر سعري بنسبة 20% عن المستورد بفضل الشراء الجماعي للقماش",
    "qualityEdgeHighlight": "بطانة حرارية مزدوجة تدوم 3 أضعاف الأصناف التجارية بالسوق",
    "description": "طقم شتوي دافئ مكون من جاكيت مبطن مقاوم للبلل والرياح وبنطال ملتون ثقيل، مصمم خصيصاً لحماية الأطفال في المخيمات ومراكز الإيواء.",
    "manufacturingSpecs": "قص كهربائي مركزي بباترون قياسي موحد (هدر أقل من 2%)، درزة وحبكة رباعية متينة، وكي بخاري وتغليف مركزي لدى شركة عون طه.",
    "tiers": [
      {
        "label": "1 – 9 قطع",
        "minQty": 1,
        "priceUsd": 12.5,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 قطع",
        "minQty": 10,
        "priceUsd": 11.25,
        "discountTag": "وفر 10%"
      },
      {
        "label": "+100 قطعة",
        "minQty": 100,
        "priceUsd": 10,
        "discountTag": "وفر 20%"
      }
    ]
  },
  {
    "id": "PRD-102",
    "title": "الزي المدرسي الموحد لطلبة المدارس",
    "sector": "الخياطة والنسيج",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL1",
    "clusterName": "تجمع شركة عون أحمد طه وشركاه",
    "enterpriseName": "شركة الزهراء للصناعة والتجارة",
    "enterpriseOwner": "شحدة مصطفى عودة",
    "enterprisePhone": "0599859518",
    "unionName": "اتحاد صناعات الملابس والنسيج",
    "priceUsd": 11,
    "unit": "طقم مدرسي",
    "dailyCapacity": "500 طقم / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-102.jpg",
    "priceSavingHighlight": "أقل بـ 18% من أسعار السوق المحلي للطلبيات المؤسسية",
    "qualityEdgeHighlight": "قماش ترجال وجبردين ثابت اللون يتحمل الغسيل المتكرر طوال العام",
    "description": "زي مدرسي موحد بمقاسات قياسية دقيقة لطلبة المدارس والمساحات التعليمية المؤقتة، متاح بكافة الألوان المعتمدة لدى الأونروا ووزارة التعليم.",
    "manufacturingSpecs": "تفصيل مركزي موحد المقاسات، تشطيب عراوي وأزرار أوتوماتيكي، وفحص جودة ثلاثي المراحل قبل التعبئة.",
    "tiers": [
      {
        "label": "1 – 9 أطقم",
        "minQty": 1,
        "priceUsd": 11,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 أطقم",
        "minQty": 10,
        "priceUsd": 10,
        "discountTag": "وفر 9%"
      },
      {
        "label": "+100 طقم",
        "minQty": 100,
        "priceUsd": 9,
        "discountTag": "وفر 18%"
      }
    ]
  },
  {
    "id": "PRD-103",
    "title": "حقيبة الكرامة النسائية والفوط الصحية القماشية",
    "sector": "مجلس سيدات الأعمال",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL3",
    "clusterName": "تجمع جلاكسي بلص لسيدات الأعمال",
    "enterpriseName": "بيت الأناقة للأزياء والخياطة",
    "enterpriseOwner": "إسراء أيمن الخباز",
    "enterprisePhone": "0598330273",
    "unionName": "مجلس سيدات الأعمال",
    "priceUsd": 14,
    "unit": "حقيبة متكاملة",
    "dailyCapacity": "300 حقيبة / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-103.jpg",
    "priceSavingHighlight": "توفير 25% في التكلفة مقارنة بالطرود المستوردة الجاهزة",
    "qualityEdgeHighlight": "قطن طبيعي 100% مضاد للحساسية وقابل للغسل وإعادة الاستخدام",
    "description": "حقيبة كرامة قماشية متينة برباط تضم فوطاً صحية قماشية متعددة الطبقات قابلة للغسل ومستلزمات قطنية نسائية مطابقة لمعايير (UNFPA).",
    "manufacturingSpecs": "حياكة نسائية متقنة بأقمشة قطنية عالية الامتصاص معقمة ومغلفة جاهزة للتوزيع الإغاثي الفوري.",
    "tiers": [
      {
        "label": "1 – 9 حقائب",
        "minQty": 1,
        "priceUsd": 14,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 حقائب",
        "minQty": 10,
        "priceUsd": 12.5,
        "discountTag": "وفر 11%"
      },
      {
        "label": "+100 حقيبة",
        "minQty": 100,
        "priceUsd": 11.2,
        "discountTag": "وفر 20%"
      }
    ]
  },
  {
    "id": "PRD-104",
    "title": "الكوتا المحمية للأطفال الرضع بالشبك الواقي",
    "sector": "مجلس سيدات الأعمال",
    "prodScope": "INTEGRATED",
    "scopeBadge": "منتج تكاملي (سيدات الأعمال + الخشبية)",
    "clusterId": "CL2",
    "clusterName": "تجمع مشغل المنال النسائي",
    "enterpriseName": "لمسة نسائية للتطريز الفلسطيني",
    "enterpriseOwner": "رندا محمود الطلاع",
    "enterprisePhone": "0592899649",
    "unionName": "مجلس سيدات الأعمال",
    "priceUsd": 38,
    "unit": "سرير كوتا محمي",
    "dailyCapacity": "75 وحدة / يوم",
    "sampleAvailable": false,
    "image": "/uploads/extracted/prd-104.jpg",
    "priceSavingHighlight": "أوفر بـ 30% من أسرة الأطفال المستوردة مع سهولة الطي والنقل",
    "qualityEdgeHighlight": "حماية محكمة 360 درجة للرضع من الحشرات والقوارض داخل الخيام",
    "description": "سرير أطفال خشبي قابل للطي مزود بفرشة قطنية مبطنة ومظلة شبكية واقية عالية المتانة لحماية الرضع في بيئة الخيام ومراكز النزوح.",
    "manufacturingSpecs": "إنتاج تكاملي مشترك: الهيكل الخشبي القابل للطي من تجمع الأخشاب، وحياكة الشبك والأرضية المبطنة في تجمع سيدات الأعمال.",
    "tiers": [
      {
        "label": "1 – 9 وحدات",
        "minQty": 1,
        "priceUsd": 38,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 وحدات",
        "minQty": 10,
        "priceUsd": 34,
        "discountTag": "وفر 11%"
      },
      {
        "label": "+100 وحدة",
        "minQty": 100,
        "priceUsd": 31,
        "discountTag": "وفر 18%"
      }
    ]
  },
  {
    "id": "PRD-105",
    "title": "السرير الخشبي الطابقي المزدوج لمراكز الإيواء",
    "sector": "الصناعات الخشبية والأثاث",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL9",
    "clusterName": "تجمع شركة الرزي للأخشاب (الوسطى)",
    "enterpriseName": "شركة كمال السعافين للموبيليا",
    "enterpriseOwner": "كمال الدين السعافين",
    "enterprisePhone": "0599850831",
    "unionName": "اتحاد الصناعات الخشبية والأثاث",
    "priceUsd": 95,
    "unit": "سرير طابقي مزدوج",
    "dailyCapacity": "45 سريراً / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-105.jpg",
    "priceSavingHighlight": "توفير 20% في السعر واستغلال مضاعف للمساحة الضيقة بالخيام",
    "qualityEdgeHighlight": "خشب سويدي مدعم بسماكات مضاعفة يتحمل الأوزان الثقيلة والرطوبة",
    "description": "سرير خشبي طابقي من دورين مع سلم وحواجز أمان علوية، مصمم لمضاعفة المساحة المعيشية للأسر النازحة داخل الغرف والخيام.",
    "manufacturingSpecs": "قص وتفريز مركزي، تجميع ببراغي فولاذية قابلة للفك والتركيب السريع، ودهان عازل للرطوبة.",
    "tiers": [
      {
        "label": "1 – 9 أسرة",
        "minQty": 1,
        "priceUsd": 95,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 أسرة",
        "minQty": 10,
        "priceUsd": 86,
        "discountTag": "وفر 9%"
      },
      {
        "label": "+100 سرير",
        "minQty": 100,
        "priceUsd": 78,
        "discountTag": "وفر 18%"
      }
    ]
  },
  {
    "id": "PRD-106",
    "title": "المقعد المدرسي الخشبي المزدوج لمدارس الخيام",
    "sector": "الصناعات الخشبية والأثاث",
    "prodScope": "INTEGRATED",
    "scopeBadge": "منتج تكاملي (الخشبية + المعدنية)",
    "clusterId": "CL7",
    "clusterName": "تجمع الجعيدي للصناعات الخشبية",
    "enterpriseName": "شركة عيسى مهنا للأخشاب",
    "enterpriseOwner": "أحمد عيسى مهنا",
    "enterprisePhone": "0599430389",
    "unionName": "اتحاد الصناعات الخشبية والأثاث",
    "priceUsd": 68,
    "unit": "مقعد مدرسي مزدوج",
    "dailyCapacity": "65 مقعداً / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-106.jpg",
    "priceSavingHighlight": "توفير 18% عن أسعار المناقصات التقليدية بفضل خط الإنتاج المدمج",
    "qualityEdgeHighlight": "هيكل حديدي ملحوم بالكامل مع ألواح خشب معالج مقاوم للكسر والخدش",
    "description": "مقعد دراسي مزدوج يتسع لطالبين مع رف سفلي للكتب ومقعد متصل، مصمم لتحمل الاستخدام اليومي الكثيف في المدارس الميدانية.",
    "manufacturingSpecs": "تكامل صناعي بين تجمع الأخشاب (قص ولصق حواف الألواح مركزياً) وتجمع المعادن (تصنيع وطلاء القوائم الحديدية).",
    "tiers": [
      {
        "label": "1 – 9 مقاعد",
        "minQty": 1,
        "priceUsd": 68,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 مقاعد",
        "minQty": 10,
        "priceUsd": 61,
        "discountTag": "وفر 10%"
      },
      {
        "label": "+100 مقعد",
        "minQty": 100,
        "priceUsd": 55,
        "discountTag": "وفر 19%"
      }
    ]
  },
  {
    "id": "PRD-107",
    "title": "موقد وفرن الحطب المعدني الآمن للطهي والتدفئة",
    "sector": "الصناعات المعدنية والهندسية",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL10",
    "clusterName": "تجمع بصل وحسنات للصناعات المعدنية",
    "enterpriseName": "مصنع مشتهى للصناعات المعدنية",
    "enterpriseOwner": "أحمد أسامة مشتهى",
    "enterprisePhone": "0594058455",
    "unionName": "اتحاد الصناعات المعدنية والهندسية",
    "priceUsd": 65,
    "unit": "موقد متكامل بالمدخنة",
    "dailyCapacity": "40 موقداً / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-107.jpg",
    "priceSavingHighlight": "يقلل استهلاك الحطب والوقود بنسبة 40% مقارنة بالمواقد البدائية",
    "qualityEdgeHighlight": "صاج حراري سميك مزود بمدخنة علوية تمنع الاختناق والدخان بالخيام",
    "description": "موقد وفرن طهي معدني آمن يعمل بالحطب أو قوالب النشارة المكبوسة، مزود بحجرة خَبز ومدخنة لتصريف الدخان خارج الخيمة بأمان.",
    "manufacturingSpecs": "قص وطعج صاج هيدروليكي مركزي، لحام حراري محكم، وطلاء حراري مقاوم للصدأ ودرجات الحرارة العالية.",
    "tiers": [
      {
        "label": "1 – 9 مواقد",
        "minQty": 1,
        "priceUsd": 65,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 مواقد",
        "minQty": 10,
        "priceUsd": 58,
        "discountTag": "وفر 11%"
      },
      {
        "label": "+100 موقد",
        "minQty": 100,
        "priceUsd": 52,
        "discountTag": "وفر 20%"
      }
    ]
  },
  {
    "id": "PRD-108",
    "title": "خزان المياه المعدني المجلفن للمخيمات (1,000 لتر)",
    "sector": "الصناعات المعدنية والهندسية",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL12",
    "clusterName": "تجمع ورشة أبو أسعد حسب الله للمعادن",
    "enterpriseName": "ورشة أبو أسعد حسب الله",
    "enterpriseOwner": "جاسر أسعد حسب الله",
    "enterprisePhone": "0598233210",
    "unionName": "اتحاد الصناعات المعدنية والهندسية",
    "priceUsd": 195,
    "unit": "خزان مع القاعدة",
    "dailyCapacity": "20 خزاناً / يوم",
    "sampleAvailable": false,
    "image": "/uploads/extracted/prd-108.jpg",
    "priceSavingHighlight": "عمر افتراضي أطول بـ 5 أضعاف من الخزانات البلاستيكية سريعة التلف",
    "qualityEdgeHighlight": "صاج مجلفن غذائي مقاوم للصدأ والثقوب وأشعة الشمس المباشرة",
    "description": "خزان مياه أسطواني صلب مصنع من الصاج المجلفن مع قاعدة حديدية حاملة، مصمم لنقاط توزيع المياه في المخيمات ومراكز الإيواء.",
    "manufacturingSpecs": "درفلة وطي صاج مجلفن قياسي، لحام غير قابل للتسريب، ومخارج سباكة قياسية جاهزة للربط بشبكات المياه.",
    "tiers": [
      {
        "label": "1 – 9 خزانات",
        "minQty": 1,
        "priceUsd": 195,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 خزانات",
        "minQty": 10,
        "priceUsd": 175,
        "discountTag": "وفر 10%"
      },
      {
        "label": "+100 خزان",
        "minQty": 100,
        "priceUsd": 160,
        "discountTag": "وفر 18%"
      }
    ]
  },
  {
    "id": "PRD-109",
    "title": "نافذة ألمنيوم الطوارئ المدمجة بالبولي كربونيت المقوى",
    "sector": "صناعات الألمنيوم والزجاج",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL14",
    "clusterName": "تجمع شركة أبو أشرف النعسان للألمنيوم",
    "enterpriseName": "شركة عياش لصناعة الألمنيوم",
    "enterpriseOwner": "مصطفى كامل عياش",
    "enterprisePhone": "0595222250",
    "unionName": "اتحاد صناعات الألمنيوم والزجاج",
    "priceUsd": 88,
    "unit": "متر مربع (م²)",
    "dailyCapacity": "90 م² / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-109.jpg",
    "priceSavingHighlight": "توفير 22% عن النوافذ التقليدية مع سرعة تركيب فورية للمساكن المتضررة",
    "qualityEdgeHighlight": "ألواح بولي كربونيت مقاومة للكسر والشظايا وعازلة لمياه الأمطار والرياح",
    "description": "نافذة ألمنيوم سحاب مصممة لمشاريع الترميم العاجل للوحدات السكنية المتضررة جزئياً كبديل دائم وآمن عن أغطية النايلون المؤقتة.",
    "manufacturingSpecs": "قص مزدوج الرأس بزاوية 45 درجة دقيقة وكبس زوايا هيدروليكي في المحطة المركزية لدى شركة النعسان.",
    "tiers": [
      {
        "label": "1 – 9 وحدات",
        "minQty": 1,
        "priceUsd": 88,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 وحدات",
        "minQty": 10,
        "priceUsd": 79,
        "discountTag": "وفر 10%"
      },
      {
        "label": "+100 وحدة",
        "minQty": 100,
        "priceUsd": 72,
        "discountTag": "وفر 18%"
      }
    ]
  },
  {
    "id": "PRD-110",
    "title": "قاطع الألمنيوم الطبي الخفيف للعيادات الميدانية",
    "sector": "صناعات الألمنيوم والزجاج",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL15",
    "clusterName": "تجمع شركة الجوهرة اللامعة للألمنيوم",
    "enterpriseName": "ورشة العجلة للألمنيوم",
    "enterpriseOwner": "عمر صبحي العجلة",
    "enterprisePhone": "0595595550",
    "unionName": "اتحاد صناعات الألمنيوم والزجاج",
    "priceUsd": 115,
    "unit": "قاطع ثلاثي متحرك",
    "dailyCapacity": "35 قاطعاً / يوم",
    "sampleAvailable": false,
    "image": "/uploads/extracted/prd-110.jpg",
    "priceSavingHighlight": "توفير 24% عن القواطع الطبية المستوردة وتوفر فوري دون انتظار المعابر",
    "qualityEdgeHighlight": "قابل للغسل والتعقيم الطبي الكامل ومزود بعجلات حركة قابلة للقفل",
    "description": "قاطع ألمنيوم طبي ثلاثي الأجنحة قابل للطي والحركة على عجلات، لتقسيم غرف الفحص والتمريض في المستشفيات والنقاط الطبية الميدانية.",
    "manufacturingSpecs": "بروفيلات ألمنيوم خفيفة وعالية الصلابة مع حشوات بولي كربونيت غير شفافة تحفظ خصوصية المرضى.",
    "tiers": [
      {
        "label": "1 – 9 قواطع",
        "minQty": 1,
        "priceUsd": 115,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 قواطع",
        "minQty": 10,
        "priceUsd": 103,
        "discountTag": "وفر 10%"
      },
      {
        "label": "+100 قاطع",
        "minQty": 100,
        "priceUsd": 94,
        "discountTag": "وفر 18%"
      }
    ]
  },
  {
    "id": "PRD-111",
    "title": "مجلى وسطح رخامي صحي للمطابخ الجماعية والنقاط الطبية",
    "sector": "الصناعات الإنشائية والرخام",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي",
    "clusterId": "CL5",
    "clusterName": "تجمع شركة فيرونا الحديثة للرخام",
    "enterpriseName": "مصنع محمد الشامي للرخام",
    "enterpriseOwner": "محمد علي الشامي",
    "enterprisePhone": "0599498099",
    "unionName": "اتحاد الصناعات الإنشائية",
    "priceUsd": 135,
    "unit": "وحدة مجلى مزدوج",
    "dailyCapacity": "25 وحدة / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-111.jpg",
    "priceSavingHighlight": "يدوم سنوات طويلة دون صدأ أو تلف ويوفر 30% من تكاليف الاستبدال",
    "qualityEdgeHighlight": "سطح رخامي طبيعي مصقول غير مسامي يمنع تراكم البكتيريا والأوبئة",
    "description": "وحدة مجلى وسطح عمل رخامي صحي بأحواض غسيل عميقة، مخصص للمطابخ الجماعية ونقاط الغسيل والعيادات الطبية في مراكز الإيواء.",
    "manufacturingSpecs": "قص آلي بالمناشير المائية المركزية وجلي وتلميع وعزل مائي كامل في تجمع شركة فيرونا الحديثة.",
    "tiers": [
      {
        "label": "1 – 9 وحدات",
        "minQty": 1,
        "priceUsd": 135,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 وحدات",
        "minQty": 10,
        "priceUsd": 121,
        "discountTag": "وفر 10%"
      },
      {
        "label": "+100 وحدة",
        "minQty": 100,
        "priceUsd": 110,
        "discountTag": "وفر 19%"
      }
    ]
  },
  {
    "id": "PRD-112",
    "title": "بلاط الإنترلوك الأسمنتي من كسر الرخام والركام المعاد تدويره",
    "sector": "الصناعات الإنشائية والرخام",
    "prodScope": "SINGLE",
    "scopeBadge": "منتج قطاعي (اقتصاد دائري)",
    "clusterId": "CL6",
    "clusterName": "تجمع مصنع المدهون للرخام",
    "enterpriseName": "شركة أونكس ستون للرخام",
    "enterpriseOwner": "سامي محمد الدريملي",
    "enterprisePhone": "0599833510",
    "unionName": "اتحاد الصناعات الإنشائية",
    "priceUsd": 9.5,
    "unit": "متر مربع (م²)",
    "dailyCapacity": "350 م² / يوم",
    "sampleAvailable": true,
    "image": "/uploads/extracted/prd-112.jpg",
    "priceSavingHighlight": "خفض التكلفة بنسبة 35% عبر استثمار كسر الرخام والركام المحلي",
    "qualityEdgeHighlight": "مقاومة كسر عالية (16 MPa) تمنع غرق ممرات المخيمات في الشتاء",
    "description": "بلاط إنترلوك متداخل مصنع من سحق كسر الرخام والركام الخرساني المعاد تدويره، لرصف ممرات المخيمات وتسهيل حركة الكراسي المتحركة.",
    "manufacturingSpecs": "فرز وسحق الحصى وكسر الرخام مركزياً، وكبس هيدروليكي عالي الكثافة بقوالب قياسية موحدة.",
    "tiers": [
      {
        "label": "1 – 99 م²",
        "minQty": 1,
        "priceUsd": 9.5,
        "discountTag": "سعر أساسي"
      },
      {
        "label": "+100 م²",
        "minQty": 100,
        "priceUsd": 8.5,
        "discountTag": "وفر 11%"
      },
      {
        "label": "+500 م²",
        "minQty": 500,
        "priceUsd": 7.6,
        "discountTag": "وفر 20%"
      }
    ]
  },
  {
    "id": "PRD-113",
    "title": "وحدة الإيواء الانتقالية المتكاملة (الكرفان الذكي)",
    "sector": "منتج تكاملي مشترك",
    "prodScope": "INTEGRATED",
    "scopeBadge": "منتج تكاملي (5 قطاعات صناعية)",
    "clusterId": "CL11",
    "clusterName": "ائتلاف التجمعات الصناعية الخمسة",
    "enterpriseName": "شركة أبو عماد سمور وأولاده",
    "enterpriseOwner": "عصام أحمد سمور",
    "enterprisePhone": "0599018887",
    "unionName": "الاتحاد العام للصناعات الفلسطينية (PFI)",
    "priceUsd": 4200,
    "unit": "وحدة إيواء متكاملة",
    "dailyCapacity": "10 وحدات / أسبوع",
    "sampleAvailable": false,
    "image": "/uploads/extracted/prd-113.jpg",
    "priceSavingHighlight": "توفير 28% عن الكرفانات المستوردة وتشغيل مباشر لـ 5 قطاعات محلية",
    "qualityEdgeHighlight": "شاسيه حديد مجلفن مع قواطع خشبية ونوافذ ألمنيوم ومجلى رخامي وفرش عازل",
    "description": "وحدة إيواء عائلية متكاملة سريعة النصب والتركيب، تشترك في صناعتها تجمعات المعادن والأخشاب والألمنيوم والرخام والنسيج كبديل آمن للخيام.",
    "manufacturingSpecs": "المعدنية: الهيكل والشاسيه | الخشبية: القواطع والأثاث الذكي | الألمنيوم: النوافذ والأبواب | الرخام: المجلى | النسيج: الفرش والستائر.",
    "tiers": [
      {
        "label": "1 – 9 وحدات",
        "minQty": 1,
        "priceUsd": 4200,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 وحدات",
        "minQty": 10,
        "priceUsd": 3850,
        "discountTag": "وفر 8%"
      },
      {
        "label": "+50 وحدة",
        "minQty": 50,
        "priceUsd": 3550,
        "discountTag": "وفر 15%"
      }
    ]
  },
  {
    "id": "PRD-114",
    "title": "العيادة الطبية المتنقلة المجهزة بالكامل",
    "sector": "منتج تكاملي مشترك",
    "prodScope": "INTEGRATED",
    "scopeBadge": "منتج تكاملي (4 قطاعات صناعية)",
    "clusterId": "CL5",
    "clusterName": "ائتلاف التجمعات الطبية والهندسية",
    "enterpriseName": "شركة فيرونا الحديثة للرخام",
    "enterpriseOwner": "مازن رشيد الشوا",
    "enterprisePhone": "0599770679",
    "unionName": "الاتحاد العام للصناعات الفلسطينية (PFI)",
    "priceUsd": 4650,
    "unit": "وحدة عيادة مجهزة",
    "dailyCapacity": "6 وحدات / أسبوع",
    "sampleAvailable": false,
    "image": "/uploads/extracted/prd-114.jpg",
    "priceSavingHighlight": "توفير 30% من تكلفة التجهيز الطبي الميداني وتسليم متكامل بعقد واحد",
    "qualityEdgeHighlight": "أسطح رخامية معقمة وقواطع ألمنيوم طبية وأسرة فحص معدنية وشراشف قطنية",
    "description": "نقطة فحص ورعاية أولية متنقلة ومعقمة جاهزة للتشغيل الفوري داخل مخيمات النزوح، مجهزة بكافة الأثاث الطبي والمغاسل الصحية.",
    "manufacturingSpecs": "المعدنية: سرير الفحص والهيكل | الرخام: الأسطح المعقمة والمغسلة | الخشب والألمنيوم: الخزائن والقواطع | سيدات الأعمال: الشراشف والستائر.",
    "tiers": [
      {
        "label": "1 – 9 وحدات",
        "minQty": 1,
        "priceUsd": 4650,
        "discountTag": "سعر مفرد"
      },
      {
        "label": "+10 وحدات",
        "minQty": 10,
        "priceUsd": 4250,
        "discountTag": "وفر 9%"
      },
      {
        "label": "+50 وحدة",
        "minQty": 50,
        "priceUsd": 3950,
        "discountTag": "وفر 15%"
      }
    ]
  }
];
