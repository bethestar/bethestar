export interface SubLawSection {
  id: string;
  label: string;
}

export interface TaxLaw {
  id: string;
  label: string;
  shortLabel?: string;
  sections: SubLawSection[];
}

export interface OtherLawCategory {
  id: string;
  label: string;
  laws: { id: string; label: string }[];
}

export interface CalculatorItem {
  id: string;
  label: string;
  description: string;
}

export interface CommunityCategory {
  id: string;
  label: string;
  description: string;
}

export const lawSubSections: SubLawSection[] = [
  { id: "law", label: "법" },
  { id: "enforcement-decree", label: "시행령" },
  { id: "enforcement-rules", label: "시행규칙" },
  { id: "general-rules", label: "통칙" },
  { id: "rulings", label: "예규·판례" },
  { id: "execution-standards", label: "집행기준" },
  { id: "appendix", label: "별표" },
  { id: "forms", label: "서식" },
];

export const taxLaws: TaxLaw[] = [
  {
    id: "corporate-tax",
    label: "법인세법",
    shortLabel: "법인세",
    sections: lawSubSections,
  },
  {
    id: "income-tax",
    label: "소득세법",
    shortLabel: "소득세",
    sections: lawSubSections,
  },
  {
    id: "vat",
    label: "부가가치세법",
    shortLabel: "부가세",
    sections: lawSubSections,
  },
  {
    id: "tax-incentive",
    label: "조세특례제한법",
    shortLabel: "조특법",
    sections: lawSubSections,
  },
  {
    id: "inheritance-gift-tax",
    label: "상속세 및 증여세법",
    shortLabel: "상증세",
    sections: lawSubSections,
  },
  {
    id: "comprehensive-real-estate-tax",
    label: "종합부동산세법",
    shortLabel: "종부세",
    sections: lawSubSections,
  },
  {
    id: "local-tax",
    label: "지방세법",
    shortLabel: "지방세",
    sections: lawSubSections,
  },
  {
    id: "national-tax-basic",
    label: "국세기본법",
    shortLabel: "국기법",
    sections: lawSubSections,
  },
  {
    id: "international-tax",
    label: "국제조세에 관한 법률",
    shortLabel: "국조법",
    sections: lawSubSections,
  },
];

export const otherLawCategories: OtherLawCategory[] = [
  {
    id: "civil-law",
    label: "민사법",
    laws: [
      { id: "civil-code", label: "민법" },
      { id: "civil-procedure", label: "민사소송법" },
      { id: "civil-execution", label: "민사집행법" },
    ],
  },
  {
    id: "commercial-law",
    label: "상사법",
    laws: [
      { id: "commercial-code", label: "상법" },
      { id: "external-audit", label: "주식회사 등의 외부감사에 관한 법률" },
      { id: "capital-market", label: "자본시장과 금융투자업에 관한 법률" },
      { id: "fair-trade", label: "독점규제 및 공정거래에 관한 법률" },
    ],
  },
  {
    id: "real-estate-law",
    label: "부동산법",
    laws: [
      { id: "real-estate-registration", label: "부동산등기법" },
      { id: "real-estate-registration-special", label: "부동산등기 특별조치법" },
      { id: "real-estate-transaction-report", label: "부동산 거래신고 등에 관한 법률" },
      { id: "real-estate-price-disclosure", label: "부동산 가격공시에 관한 법률" },
      { id: "licensed-agent", label: "공인중개사법" },
      { id: "housing", label: "주택법" },
      { id: "building", label: "건축법" },
      { id: "urban-renewal", label: "도시 및 주거환경정비법" },
      { id: "reconstruction-excess-profit", label: "재건축초과이익 환수에 관한 법률" },
      { id: "housing-lease-protection", label: "주택임대차보호법" },
      { id: "commercial-lease-protection", label: "상가건물 임대차보호법" },
      { id: "land-compensation", label: "공익사업을 위한 토지 등의 취득 및 보상에 관한 법률" },
      { id: "farmland", label: "농지법" },
      { id: "forest-land", label: "산지관리법" },
      { id: "national-land-planning", label: "국토의 계획 및 이용에 관한 법률" },
      { id: "urban-development", label: "도시개발법" },
      { id: "appraisal", label: "감정평가 및 감정평가사에 관한 법률" },
      { id: "rental-business", label: "민간임대주택에 관한 특별법" },
    ],
  },
  {
    id: "administrative-law",
    label: "행정법",
    laws: [
      { id: "administrative-basic", label: "행정기본법" },
      { id: "administrative-procedure", label: "행정절차법" },
      { id: "administrative-litigation", label: "행정소송법" },
      { id: "administrative-appeal", label: "행정심판법" },
    ],
  },
  {
    id: "tax-procedure-law",
    label: "조세절차·처벌법",
    laws: [
      { id: "national-tax-collection", label: "국세징수법" },
      { id: "tax-crime-punishment", label: "조세범 처벌법" },
      { id: "tax-crime-procedure", label: "조세범 처벌절차법" },
      { id: "local-tax-basic", label: "지방세기본법" },
      { id: "local-tax-collection", label: "지방세징수법" },
      { id: "local-tax-incentive", label: "지방세특례제한법" },
    ],
  },
  {
    id: "finance-forex-law",
    label: "금융·외환법",
    laws: [
      { id: "foreign-exchange", label: "외국환거래법" },
      { id: "specific-financial-transaction", label: "특정 금융거래정보의 보고 및 이용 등에 관한 법률" },
      { id: "financial-real-name", label: "금융실명거래 및 비밀보장에 관한 법률" },
      { id: "electronic-financial-transaction", label: "전자금융거래법" },
      { id: "credit-specialized-finance", label: "여신전문금융업법" },
    ],
  },
  {
    id: "labor-law",
    label: "노동법",
    laws: [
      { id: "labor-standards", label: "근로기준법" },
      { id: "retirement-benefit", label: "근로자퇴직급여 보장법" },
      { id: "employment-insurance", label: "고용보험법" },
      { id: "industrial-accident", label: "산업재해보상보험법" },
    ],
  },
  {
    id: "public-interest-nonprofit",
    label: "공익법인·비영리법",
    laws: [
      { id: "public-interest-corporation", label: "공익법인의 설립·운영에 관한 법률" },
      { id: "nonprofit-corporation", label: "비영리법인의 설립 및 감독에 관한 규칙" },
      { id: "social-enterprise", label: "사회적기업 육성법" },
      { id: "cooperative", label: "협동조합 기본법" },
    ],
  },
  {
    id: "corporate-related",
    label: "기업관련법",
    laws: [
      { id: "sme-basic", label: "중소기업기본법" },
      { id: "venture-business", label: "벤처기업육성에 관한 특별조치법" },
      { id: "debtor-rehabilitation", label: "채무자 회생 및 파산에 관한 법률" },
      { id: "small-business-promotion", label: "소상공인 보호 및 지원에 관한 법률" },
    ],
  },
  {
    id: "international-trade",
    label: "국제거래법",
    laws: [
      { id: "customs", label: "관세법" },
      { id: "foreign-trade", label: "대외무역법" },
      { id: "foreign-investment-promotion", label: "외국인투자 촉진법" },
    ],
  },
  {
    id: "other-tax-related",
    label: "기타 세법",
    laws: [
      { id: "individual-consumption-tax", label: "개별소비세법" },
      { id: "education-tax", label: "교육세법" },
      { id: "transportation-energy-environment-tax", label: "교통·에너지·환경세법" },
      { id: "rural-special-tax", label: "농어촌특별세법" },
      { id: "stamp-tax", label: "인지세법" },
      { id: "securities-transaction-tax", label: "증권거래세법" },
    ],
  },
];

export const calculatorCategories: CalculatorItem[] = [
  { id: "income-tax-calc", label: "종합소득세 계산기", description: "종합소득세 산출세액 계산" },
  { id: "corporate-tax-calc", label: "법인세 계산기", description: "법인세 산출세액 계산" },
  { id: "vat-calc", label: "부가가치세 계산기", description: "부가가치세 납부세액 계산" },
  { id: "capital-gains-calc", label: "양도소득세 계산기", description: "부동산·주식 양도소득세 계산" },
  { id: "inheritance-tax-calc", label: "상속세 계산기", description: "상속세 산출세액 계산" },
  { id: "gift-tax-calc", label: "증여세 계산기", description: "증여세 산출세액 계산" },
  { id: "comprehensive-real-estate-tax-calc", label: "종합부동산세 계산기", description: "종합부동산세 산출세액 계산" },
  { id: "retirement-income-calc", label: "퇴직소득세 계산기", description: "퇴직소득세 산출세액 계산" },
  { id: "earned-income-calc", label: "근로소득세 계산기", description: "간이세액표 기반 근로소득세 계산" },
  { id: "local-income-tax-calc", label: "지방소득세 계산기", description: "지방소득세 산출세액 계산" },
  { id: "acquisition-tax-calc", label: "취득세 계산기", description: "부동산·차량 취득세 계산" },
  { id: "registration-tax-calc", label: "등록면허세 계산기", description: "등기·등록 시 등록면허세 계산" },
  { id: "withholding-tax-calc", label: "원천징수세액 계산기", description: "각종 원천징수세액 계산" },
  { id: "depreciation-calc", label: "감가상각비 계산기", description: "정액법·정률법 감가상각비 계산" },
  { id: "interest-calc", label: "가산세·가산금 계산기", description: "각종 가산세 및 가산금 계산" },
  { id: "tax-refund-calc", label: "환급세액 계산기", description: "부가세·소득세 환급세액 계산" },
];

export const communityCategories: CommunityCategory[] = [
  { id: "tax-accountant", label: "세무사", description: "세무사 전용 커뮤니티" },
  { id: "cpa", label: "회계사", description: "공인회계사 전용 커뮤니티" },
  { id: "appraiser", label: "감정평가사", description: "감정평가사 전용 커뮤니티" },
  { id: "judicial-scrivener", label: "법무사", description: "법무사 전용 커뮤니티" },
  { id: "labor-attorney", label: "공인노무사", description: "공인노무사 전용 커뮤니티" },
  { id: "customs-broker", label: "관세사", description: "관세사 전용 커뮤니티" },
  { id: "licensed-realtor", label: "공인중개사", description: "공인중개사 전용 커뮤니티" },
];

export interface MenuItem {
  id: string;
  label: string;
  href: string;
}

export const mainMenuItems: MenuItem[] = [
  { id: "tax", label: "세무", href: "/tax" },
  { id: "accounting", label: "회계", href: "/accounting" },
  { id: "other-laws", label: "기타법", href: "/other-laws" },
  { id: "calculator", label: "계산기", href: "/calculator" },
  { id: "forms", label: "양식", href: "/forms" },
  { id: "community", label: "커뮤니티", href: "/community" },
  { id: "support", label: "지원사업", href: "/support" },
];
