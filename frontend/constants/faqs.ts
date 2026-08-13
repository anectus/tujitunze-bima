import { FAQItem } from "@/components/common/FAQAccordion";

export type { FAQItem };

export const homeFaqs: FAQItem[] = [
  {
    question: "What is Tujitunze?",
    answer:
      "Tujitunze is a health savings and insurance management platform for Tanzania. It lets you save toward healthcare costs, contribute through your telecom or bank account, and access verified partner hospitals — all from one account.",
  },
  {
    question: "Is Tujitunze free to use?",
    answer:
      "Creating an account and using the wallet, telecom contributions, and hospital verification features is free. Any transaction or contribution fees are shown clearly before you confirm, so there are never hidden charges.",
  },
  {
    question: "How do I add money to my wallet?",
    answer:
      "You can top up your Tujitunze wallet through mobile money with Vodacom, Airtel, Yas Money, Halotel, or TTCL, or by linking a supported bank account directly from your dashboard.",
  },
  {
    question: "Do I need a bank account to use Tujitunze?",
    answer:
      "No. The wallet is built for the mtu wa kawaida — the ordinary person. Mobile money is enough to save small amounts daily; a bank account is only an extra option for members who prefer one.",
  },
  {
    question: "Can hospitals verify my membership?",
    answer:
      "Yes. Partner hospitals can verify your active membership at the point of care, so you don't need to carry paperwork — your account status is checked instantly.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes. Tujitunze uses authenticated, role-based access to protect your account, and your NIDA and financial details are only used to verify your identity and manage your own savings and coverage.",
  },
];

export const servicesFaqs: FAQItem[] = [
  {
    question:
      "What's the difference between the wallet and telecom contributions?",
    answer:
      "Your wallet is where your health savings are held and tracked. Telecom contributions are one of the ways you can add money into that wallet, using mobile money from your network operator.",
  },
  {
    question: "Which banks does Tujitunze support?",
    answer:
      "Tujitunze integrates with partner banks to let you link an account and move funds securely. Supported banks are shown when you add a bank account from your profile.",
  },
  {
    question: "How does hospital verification work?",
    answer:
      "When you visit a partner hospital, staff can look up your membership status through Tujitunze before providing services, confirming your coverage without extra paperwork.",
  },
  {
    question: "What is member management used for?",
    answer:
      "It covers your registration details, NIDA identification, linked phone numbers, and profile — everything that keeps your account accurate and secure.",
  },
];

export interface FAQCategory {
  category: string;
  items: FAQItem[];
}

export const helpFaqCategories: FAQCategory[] = [
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I create a Tujitunze account?",
        answer:
          "Sign up from the homepage with your name, phone number, and NIDA details. Once verified, you can start saving and contributing right away.",
      },
      {
        question: "What do I need to sign up?",
        answer:
          "You'll need a valid phone number and your NIDA (National ID) details to complete sign up.",
      },
    ],
  },
  {
    category: "Wallet & Contributions",
    items: [
      {
        question: "How do I top up my wallet?",
        answer:
          "Use mobile money from a supported telecom operator, or link a bank account from your profile settings.",
      },
      {
        question: "Can I withdraw funds from my wallet?",
        answer:
          "Yes, withdrawals are available from your wallet dashboard, subject to your account's linked payment methods.",
      },
    ],
  },
  {
    category: "Insurance & Claims",
    items: [
      {
        question: "How do I check my coverage?",
        answer:
          "Your active insurance plan and coverage details are shown on your Insurance page once logged in.",
      },
      {
        question: "How do I submit a claim?",
        answer:
          "Claims are submitted from the Insurance section of your dashboard, where you can track their status until they're resolved.",
      },
    ],
  },
  {
    category: "Hospitals",
    items: [
      {
        question: "How do I find a partner hospital?",
        answer:
          "Use the Hospitals section of your dashboard to search partner facilities near you and see which accept your coverage.",
      },
      {
        question: "Does the hospital need anything from me?",
        answer:
          "No — hospital staff can verify your membership directly through Tujitunze at the point of care.",
      },
    ],
  },
  {
    category: "Account & Security",
    items: [
      {
        question: "Is my data shared with third parties?",
        answer:
          "Your account data is used only to manage your own savings, coverage, and verification — it isn't sold or shared beyond what's needed to provide the service.",
      },
      {
        question: "What do I do if I forget my password?",
        answer:
          'Use the "Forgot password" link on the login page to reset it via your registered phone number.',
      },
    ],
  },
];
