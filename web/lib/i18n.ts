export const locales = ["en", "hi", "ta"] as const;
export type Locale = (typeof locales)[number];
type AuthCopy = {
  home: string; dashboard: string; login: string; logout: string; email: string;
  password: string; signup: string; magic: string; sent: string; error: string;
  invalid: string; unavailable: string; forbidden: string; callback: string;
  loading: string; welcome: string; role: string; pending: string;
  roles: Record<"anonymous" | "citizen" | "officer" | "issuer_admin" | "root_authority", string>;
};
export const authMessages: Record<Locale, AuthCopy> = {
  en: {
    home: "Home", dashboard: "Dashboard", login: "Log in", logout: "Log out",
    email: "Email", password: "Password (at least 8 characters to sign up)", signup: "Create account",
    magic: "Email me a sign-in link", sent: "Check your email for a confirmation or sign-in link. Open it in this browser.",
    error: "Unable to sign in. Check your details or try again later.", invalid: "Enter a valid email and password.",
    unavailable: "Login is not configured or is temporarily unavailable. Check the Supabase setup in README.",
    forbidden: "Your account does not have access to this page.", callback: "This sign-in link could not be used. Request a new link in this browser.",
    loading: "Loading account…", welcome: "Your account", role: "Role", pending: "Working…",
    roles: { anonymous: "Guest", citizen: "Citizen", officer: "Officer", issuer_admin: "Institution administrator", root_authority: "Root authority" },
  },
  hi: {
    home: "मुख्य पृष्ठ", dashboard: "डैशबोर्ड", login: "लॉग इन करें", logout: "लॉग आउट करें",
    email: "ईमेल", password: "पासवर्ड (खाता बनाने के लिए कम से कम 8 अक्षर)", signup: "खाता बनाएँ",
    magic: "ईमेल से लॉग इन लिंक भेजें", sent: "पुष्टि या लॉग इन लिंक के लिए अपना ईमेल देखें। इसे इसी ब्राउज़र में खोलें।",
    error: "लॉग इन नहीं हो सका। विवरण जाँचें या बाद में फिर प्रयास करें।", invalid: "सही ईमेल और पासवर्ड दर्ज करें।",
    unavailable: "लॉग इन उपलब्ध नहीं है। README में Supabase सेटअप जाँचें।",
    forbidden: "आपके खाते को इस पृष्ठ की अनुमति नहीं है।", callback: "यह लिंक काम नहीं कर सका। इसी ब्राउज़र में नया लिंक माँगें।",
    loading: "खाता लोड हो रहा है…", welcome: "आपका खाता", role: "भूमिका", pending: "कृपया प्रतीक्षा करें…",
    roles: { anonymous: "अतिथि", citizen: "नागरिक", officer: "अधिकारी", issuer_admin: "संस्था प्रशासक", root_authority: "मुख्य प्राधिकरण" },
  },
  ta: {
    home: "முகப்பு", dashboard: "தாக்க அளவுகள்", login: "உள்நுழையவும்", logout: "வெளியேறவும்",
    email: "மின்னஞ்சல்", password: "கடவுச்சொல் (பதிவுக்கு குறைந்தது 8 எழுத்துகள்)", signup: "கணக்கை உருவாக்கவும்",
    magic: "உள்நுழைவு இணைப்பை அனுப்பவும்", sent: "உறுதிப்படுத்தல் அல்லது உள்நுழைவு இணைப்பிற்கு மின்னஞ்சலைப் பார்க்கவும். இதே உலாவியில் திறக்கவும்.",
    error: "உள்நுழைய முடியவில்லை. விவரங்களைச் சரிபார்க்கவும் அல்லது பின்னர் முயற்சிக்கவும்.", invalid: "சரியான மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.",
    unavailable: "உள்நுழைவு கிடைக்கவில்லை. README இல் Supabase அமைப்பைப் பார்க்கவும்.",
    forbidden: "இந்தப் பக்கத்தை அணுக உங்கள் கணக்கிற்கு அனுமதி இல்லை.", callback: "இந்த இணைப்பைப் பயன்படுத்த முடியவில்லை. இதே உலாவியில் புதிய இணைப்பைக் கோரவும்.",
    loading: "கணக்கு ஏற்றப்படுகிறது…", welcome: "உங்கள் கணக்கு", role: "பங்கு", pending: "காத்திருக்கவும்…",
    roles: { anonymous: "விருந்தினர்", citizen: "குடிமகன்", officer: "அதிகாரி", issuer_admin: "நிறுவன நிர்வாகி", root_authority: "முதன்மை அதிகாரம்" },
  },
};
export const modules = ["verify", "analyze", "registry", "officer", "login"] as const;
export type Module = (typeof modules)[number];

type Messages = {
  brand: string; eyebrow: string; title: string; subtitle: string;
  language: string; back: string; comingSoon: string; scaffold: string; health: string;
  cards: Record<Module, { title: string; description: string }>;
};

export const languageNames: Record<Locale, string> = { en: "English", hi: "हिन्दी", ta: "தமிழ்" };
export const messages: Record<Locale, Messages> = {
  en: {
    health: "Service health (JSON)",
    brand: "SatyaCall", eyebrow: "Pause. Check. Stay safe.",
    title: "A familiar name is not proof. Verify the caller.",
    subtitle: "Tools to help you check official contact and spot impersonation scams.",
    language: "Choose your language", back: "Back to home", comingSoon: "Coming soon",
    scaffold: "Verification and local analysis are available. Live Assist uses text or dictation; UPI Guard is a simulation.",
    cards: {
      login: { title: "Log in", description: "Access your account, saved history and reporting tools." },
      verify: { title: "Verify a caller", description: "Check whether a caller can prove their official identity." },
      analyze: { title: "Check a message", description: "Look for scam tactics in a message or call transcript." },
      registry: { title: "Scam registry", description: "Look up or report a suspicious phone number, UPI ID or wallet." },
      officer: { title: "Officer portal", description: "Prove your identity by responding to a citizen’s challenge." },
    },
  },
  hi: {
    health: "सेवा की स्थिति (JSON)",
    brand: "सत्यकॉल", eyebrow: "रुकें। जाँचें। सुरक्षित रहें।",
    title: "सिर्फ नाम पर भरोसा न करें। कॉल करने वाले की पहचान जाँचें।",
    subtitle: "आधिकारिक संपर्क की जाँच करें और पहचान की नकल करके की जाने वाली ठगी से बचें।",
    language: "अपनी भाषा चुनें", back: "मुख्य पृष्ठ पर लौटें", comingSoon: "जल्द आ रहा है",
    scaffold: "पहचान की जाँच और स्थानीय विश्लेषण उपलब्ध हैं। लाइव सहायता पाठ या डिक्टेशन से चलती है; UPI सुरक्षा सिमुलेशन है।",
    cards: {
      login: { title: "लॉग इन करें", description: "अपने खाते, पुराने रिकॉर्ड और रिपोर्ट करने के साधनों तक पहुँचें।" },
      verify: { title: "कॉलर की पहचान जाँचें", description: "जाँचें कि कॉल करने वाला अपनी आधिकारिक पहचान साबित कर सकता है या नहीं।" },
      analyze: { title: "संदेश जाँचें", description: "संदेश या कॉल के लिखित विवरण में ठगी के संकेत खोजें।" },
      registry: { title: "ठगी रजिस्ट्री", description: "संदिग्ध फोन नंबर, यूपीआई आईडी या वॉलेट खोजें या उसकी रिपोर्ट करें।" },
      officer: { title: "अधिकारी पोर्टल", description: "नागरिक की चुनौती का उत्तर देकर अपनी पहचान साबित करें।" },
    },
  },
  ta: {
    health: "சேவை நிலை (JSON)",
    brand: "சத்யாகால்", eyebrow: "நிறுத்துங்கள். சரிபாருங்கள். பாதுகாப்பாக இருங்கள்.",
    title: "பெயர் மட்டும் ஆதாரம் அல்ல. அழைப்பவரைச் சரிபாருங்கள்.",
    subtitle: "அதிகாரப்பூர்வ தொடர்பைச் சரிபார்க்கவும் ஆள்மாறாட்ட மோசடிகளைக் கண்டறியவும் உதவும் கருவிகள்.",
    language: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்", back: "முகப்புக்குத் திரும்புக", comingSoon: "விரைவில் வருகிறது",
    scaffold: "சரிபார்ப்பும் உள்ளூர் பகுப்பாய்வும் கிடைக்கும். நேரடி உதவி உரை அல்லது உச்சரிப்பைப் பயன்படுத்தும்; UPI பாதுகாப்பு உருவகப்படுத்தல் மட்டுமே.",
    cards: {
      login: { title: "உள்நுழையவும்", description: "உங்கள் கணக்கு, சேமித்த வரலாறு மற்றும் புகாரளிக்கும் கருவிகளை அணுகவும்." },
      verify: { title: "அழைப்பவரைச் சரிபார்க்கவும்", description: "அழைப்பவர் தனது அதிகாரப்பூர்வ அடையாளத்தை நிரூபிக்க முடியுமா எனச் சரிபார்க்கவும்." },
      analyze: { title: "செய்தியைச் சரிபார்க்கவும்", description: "செய்தி அல்லது அழைப்பின் எழுத்துப் பதிவில் மோசடி உத்திகளைக் கண்டறியவும்." },
      registry: { title: "மோசடிப் பதிவேடு", description: "சந்தேகமான தொலைபேசி எண், UPI அடையாளம் அல்லது வாலட்டைத் தேடவும் அல்லது புகாரளிக்கவும்." },
      officer: { title: "அதிகாரி தளம்", description: "குடிமகனின் சவாலுக்குப் பதிலளித்து உங்கள் அடையாளத்தை நிரூபிக்கவும்." },
    },
  },
};

type OnboardingCopy = {
  issuer: string; root: string; officer: string; key: string; keyHint: string; passphrase: string;
  generate: string; unlock: string; lock: string; backup: string; importBackup: string; backupHint: string;
  address: string; account: string; name: string; category: string; title: string; institution: string;
  apply: string; approve: string; revoke: string; issue: string; expires: string; refresh: string;
  downloadCredential: string; importCredential: string; credentialValid: string; credentialHint: string;
  pending: string; active: string; revoked: string; empty: string; success: string; error: string;
  locked: string; working: string; publicOnly: string; transaction: string; reconcile: string;
  categories: Record<"bank" | "police" | "government" | "courier" | "other", string>;
};
export const onboardingMessages: Record<Locale, OnboardingCopy> = {
  en: {
    issuer: "Institution onboarding", root: "Institution approvals", officer: "Officer onboarding", key: "Your browser-held key",
    keyHint: "Only your public address and signatures are submitted. Your private key stays in this browser.",
    passphrase: "Key passphrase (at least 12 characters)", generate: "Generate and encrypt key", unlock: "Unlock key", lock: "Lock key",
    backup: "Download encrypted backup", importBackup: "Import encrypted backup",
    backupHint: "Keep an encrypted backup and your passphrase safe. Clearing browser storage loses the saved key; a forgotten passphrase cannot be recovered. Protect this device from malicious scripts and extensions.",
    address: "Public wallet address", account: "Account ID", name: "Name", category: "Institution category", title: "Officer title",
    institution: "Institution", apply: "Submit application", approve: "Approve", revoke: "Revoke", issue: "Sign and issue credential",
    expires: "Credential expiry", refresh: "Refresh status", downloadCredential: "Download credential", importCredential: "Import credential",
    credentialValid: "Credential signature and expiry checked", credentialHint: "This checks the signature only. Trust also requires the institution to be active on-chain and the credential to be unrevoked in the database. Identity does not authorize payments or other actions.",
    pending: "Pending approval", active: "Active", revoked: "Revoked", empty: "No applications yet.", success: "Saved. Status updated.",
    error: "Unable to complete this action. Check your passphrase, key, input and service configuration.", locked: "Unlock the key matching this institution before signing.",
    working: "Working…", publicOnly: "Select an active institution and apply using your browser-held key. The administrator reviews your application before issuing a credential.",
    transaction: "On-chain transaction", reconcile: "A chain operation needs reconciliation. Refresh, then repeat the same approval or revocation to check its transaction. Do not submit a different transaction.",
    categories: { bank: "Bank", police: "Police", government: "Government", courier: "Courier", other: "Other" },
  },
  hi: {
    issuer: "संस्था का पंजीकरण", root: "संस्थाओं की मंज़ूरी", officer: "अधिकारी का पंजीकरण", key: "ब्राउज़र में आपकी कुंजी",
    keyHint: "केवल सार्वजनिक पता और हस्ताक्षर भेजे जाते हैं। निजी कुंजी इसी ब्राउज़र में रहती है।",
    passphrase: "कुंजी का पासफ़्रेज़ (कम से कम 12 अक्षर)", generate: "कुंजी बनाएँ और एन्क्रिप्ट करें", unlock: "कुंजी खोलें", lock: "कुंजी लॉक करें",
    backup: "एन्क्रिप्टेड बैकअप डाउनलोड करें", importBackup: "एन्क्रिप्टेड बैकअप आयात करें",
    backupHint: "बैकअप और पासफ़्रेज़ सुरक्षित रखें। ब्राउज़र डेटा मिटाने से कुंजी खो सकती है। भूला पासफ़्रेज़ वापस नहीं मिलता। हानिकारक स्क्रिप्ट और एक्सटेंशन से बचें।",
    address: "सार्वजनिक वॉलेट पता", account: "खाता आईडी", name: "नाम", category: "संस्था की श्रेणी", title: "अधिकारी का पद",
    institution: "संस्था", apply: "आवेदन भेजें", approve: "मंज़ूरी दें", revoke: "रद्द करें", issue: "हस्ताक्षर कर प्रमाणपत्र जारी करें", expires: "प्रमाणपत्र की समाप्ति", refresh: "स्थिति अपडेट करें",
    downloadCredential: "प्रमाणपत्र डाउनलोड करें", importCredential: "प्रमाणपत्र आयात करें", credentialValid: "हस्ताक्षर और समाप्ति जाँची गई",
    credentialHint: "यह केवल हस्ताक्षर की जाँच है। संस्था ऑन-चेन सक्रिय होनी चाहिए और प्रमाणपत्र डेटाबेस में रद्द नहीं होना चाहिए। पहचान से भुगतान या अन्य कार्रवाई की अनुमति नहीं मिलती।",
    pending: "मंज़ूरी लंबित", active: "सक्रिय", revoked: "रद्द", empty: "अभी कोई आवेदन नहीं है।", success: "सहेजा गया। स्थिति अपडेट हुई।",
    error: "कार्य पूरा नहीं हुआ। पासफ़्रेज़, कुंजी, विवरण और सेवा सेटअप जाँचें।", locked: "हस्ताक्षर के लिए संस्था की सही कुंजी खोलें।", working: "कृपया प्रतीक्षा करें…",
    publicOnly: "सक्रिय संस्था चुनकर अपनी ब्राउज़र कुंजी से आवेदन करें। प्रशासक समीक्षा के बाद प्रमाणपत्र जारी करेगा।",
    transaction: "ऑन-चेन लेनदेन", reconcile: "चेन कार्य की जाँच ज़रूरी है। स्थिति अपडेट कर वही मंज़ूरी या रद्द करने का कार्य दोहराएँ। नया लेनदेन न भेजें।",
    categories: { bank: "बैंक", police: "पुलिस", government: "सरकार", courier: "कूरियर", other: "अन्य" },
  },
  ta: {
    issuer: "நிறுவனப் பதிவு", root: "நிறுவன ஒப்புதல்கள்", officer: "அதிகாரிப் பதிவு", key: "உலாவியில் உங்கள் சாவி",
    keyHint: "பொது முகவரியும் கையொப்பங்களும் மட்டுமே அனுப்பப்படும். தனிச் சாவி இந்த உலாவியில் இருக்கும்.",
    passphrase: "சாவியின் கடவுச்சொற்றொடர் (குறைந்தது 12 எழுத்துகள்)", generate: "சாவியை உருவாக்கி மறையாக்கு", unlock: "சாவியைத் திற", lock: "சாவியைப் பூட்டு",
    backup: "மறையாக்கிய காப்பைப் பதிவிறக்கு", importBackup: "மறையாக்கிய காப்பை இறக்குமதி செய்",
    backupHint: "காப்பையும் கடவுச்சொற்றொடரையும் பாதுகாக்கவும். உலாவித் தரவை அழித்தால் சாவி இழக்கப்படும். மறந்த கடவுச்சொற்றொடரை மீட்க முடியாது. தீங்கான நிரல்கள் மற்றும் நீட்டிப்புகளிலிருந்து சாதனத்தைப் பாதுகாக்கவும்.",
    address: "பொது வாலட் முகவரி", account: "கணக்கு அடையாளம்", name: "பெயர்", category: "நிறுவன வகை", title: "அதிகாரிப் பதவி", institution: "நிறுவனம்",
    apply: "விண்ணப்பத்தை அனுப்பு", approve: "ஒப்புதல் அளி", revoke: "ரத்து செய்", issue: "கையொப்பமிட்டு சான்றிதழ் வழங்கு", expires: "சான்றிதழ் காலாவதி", refresh: "நிலையைப் புதுப்பி",
    downloadCredential: "சான்றிதழைப் பதிவிறக்கு", importCredential: "சான்றிதழை இறக்குமதி செய்", credentialValid: "கையொப்பமும் காலாவதியும் சரிபார்க்கப்பட்டன",
    credentialHint: "இது கையொப்பச் சரிபார்ப்பு மட்டுமே. நிறுவனம் பிளாக்செயினில் செயலில் இருக்க வேண்டும்; தரவுத்தளத்தில் சான்றிதழ் ரத்தாகியிருக்கக் கூடாது. அடையாளம் பணம் செலுத்த அல்லது பிற செயல்களுக்கு அனுமதி அளிக்காது.",
    pending: "ஒப்புதல் நிலுவையில்", active: "செயலில்", revoked: "ரத்து செய்யப்பட்டது", empty: "விண்ணப்பங்கள் இல்லை.", success: "சேமிக்கப்பட்டது. நிலை புதுப்பிக்கப்பட்டது.",
    error: "செயலை முடிக்க முடியவில்லை. கடவுச்சொற்றொடர், சாவி, விவரங்கள் மற்றும் சேவை அமைப்பைச் சரிபார்க்கவும்.", locked: "கையொப்பமிட நிறுவனத்தின் சரியான சாவியைத் திறக்கவும்.", working: "காத்திருக்கவும்…",
    publicOnly: "செயலில் உள்ள நிறுவனத்தைத் தேர்ந்து உலாவிச் சாவியுடன் விண்ணப்பிக்கவும். நிர்வாகி மதிப்பாய்வு செய்து சான்றிதழ் வழங்குவார்.", transaction: "பிளாக்செயின் பரிவர்த்தனை",
    reconcile: "பரிவர்த்தனை நிலையைச் சரிபார்க்க வேண்டும். புதுப்பித்து அதே ஒப்புதல் அல்லது ரத்து செயலை மீண்டும் செய்யவும். வேறு பரிவர்த்தனை அனுப்ப வேண்டாம்.",
    categories: { bank: "வங்கி", police: "காவல்துறை", government: "அரசு", courier: "கூரியர்", other: "மற்றவை" },
  },
};

type VerificationCopy = {
  heading:string; entity:string; category:string; create:string; code:string; challengeId:string; expires:string; expired:string;
  token:string; check:string; load:string; sign:string; copy:string; copied:string; review:string; warning:string;
  scan:string; stop:string; cameraError:string; qr:string; error:string; pending:string;
  results:Record<"VERIFIED"|"NOT_VERIFIED"|"MISMATCH"|"VERIFIED_AUTHORIZED"|"IDENTITY_VERIFIED_NOT_AUTHORIZED",string>; reasons:Record<string,string>;
};
export const verificationMessages:Record<Locale,VerificationCopy> = {
 en:{ heading:"Verify a caller",entity:"Who does the caller claim to represent?",category:"Claimed institution category",create:"Create challenge",code:"Tell the caller this single-use code",challengeId:"Challenge ID",expires:"Seconds remaining",expired:"This challenge has expired. Create a new one.",token:"Paste the officer's response token",check:"Verify response",load:"Load citizen challenge",sign:"Sign this challenge",copy:"Copy",copied:"Copied",review:"Review the citizen's claimed entity before signing",warning:"Identity is not authorization. Only a matching approved action authorizes the stated request; no payment is executed here.",scan:"Scan QR with camera",stop:"Stop camera",cameraError:"Camera unavailable. Use HTTPS or localhost, grant camera permission, or paste the token.",qr:"Officer response QR",error:"Unable to complete verification. Check your input and service setup; retry with a fresh challenge if needed.",pending:"Working…",
 results:{VERIFIED_AUTHORIZED:"VERIFIED + AUTHORIZED",IDENTITY_VERIFIED_NOT_AUTHORIZED:"IDENTITY VERIFIED — REQUEST NOT AUTHORIZED",VERIFIED:"VERIFIED",NOT_VERIFIED:"NOT VERIFIED",MISMATCH:"MISMATCH"},reasons:{IDENTITY_VERIFIED:"Officer signature, credential and active institution confirmed.",CATEGORY_MISMATCH:"The officer's institution category differs from what the caller claimed.",CHALLENGE_USED:"This challenge has already been used. Create a new one.",CHALLENGE_EXPIRED:"This challenge has expired. Create a new one.",ATTEMPTS_EXHAUSTED:"Five attempts have been used. Create a new challenge.",CHALLENGE_NOT_FOUND:"The challenge could not be found.",WRONG_CHALLENGE:"This token belongs to a different challenge.",INVALID_TOKEN:"The response token is invalid.",INVALID_SIGNATURE:"The officer signature does not match this challenge.",OFFICER_NOT_FOUND:"No issued officer credential matches this signing key.",CREDENTIAL_REVOKED_OR_EXPIRED:"The officer credential is revoked or expired.",INVALID_CREDENTIAL:"The institution's credential signature could not be verified.",ISSUER_REVOKED:"The institution is not active.",VERIFICATION_UNAVAILABLE:"Verification services are unavailable. Identity has not been verified.",RATE_LIMITED:"Too many requests. Wait a minute before trying again."}},
 hi:{heading:"कॉलर की पहचान जाँचें",entity:"कॉलर किस संस्था से होने का दावा करता है?",category:"बताई गई संस्था की श्रेणी",create:"चुनौती बनाएँ",code:"कॉलर को यह एक बार उपयोग होने वाला कोड बताएँ",challengeId:"चुनौती आईडी",expires:"शेष सेकंड",expired:"चुनौती समाप्त हो गई। नई चुनौती बनाएँ।",token:"अधिकारी का जवाब टोकन पेस्ट करें",check:"जवाब जाँचें",load:"नागरिक की चुनौती लोड करें",sign:"चुनौती पर हस्ताक्षर करें",copy:"कॉपी करें",copied:"कॉपी हो गया",review:"हस्ताक्षर से पहले नागरिक की बताई संस्था देखें",warning:"पहचान अनुमति नहीं है। केवल स्वीकृत कार्रवाई से मेल खाने वाले अनुरोध को अनुमति है; यहाँ भुगतान नहीं होता।",scan:"कैमरे से QR स्कैन करें",stop:"कैमरा बंद करें",cameraError:"कैमरा उपलब्ध नहीं है। HTTPS या localhost और कैमरा अनुमति उपयोग करें, या टोकन पेस्ट करें।",qr:"अधिकारी के जवाब का QR",error:"जाँच पूरी नहीं हुई। विवरण और सेवा सेटअप जाँचें। ज़रूरत हो तो नई चुनौती लें।",pending:"कृपया प्रतीक्षा करें…",
 results:{VERIFIED_AUTHORIZED:"पहचान और अनुरोध सत्यापित",IDENTITY_VERIFIED_NOT_AUTHORIZED:"पहचान सत्यापित — अनुरोध की अनुमति नहीं",VERIFIED:"पहचान सत्यापित",NOT_VERIFIED:"पहचान सत्यापित नहीं",MISMATCH:"श्रेणी मेल नहीं खाती"},reasons:{IDENTITY_VERIFIED:"अधिकारी के हस्ताक्षर, प्रमाणपत्र और सक्रिय संस्था की पुष्टि हुई।",CATEGORY_MISMATCH:"अधिकारी की संस्था की श्रेणी कॉलर के दावे से अलग है।",CHALLENGE_USED:"यह चुनौती इस्तेमाल हो चुकी है। नई चुनौती बनाएँ।",CHALLENGE_EXPIRED:"चुनौती समाप्त हो गई। नई चुनौती बनाएँ।",ATTEMPTS_EXHAUSTED:"पाँच प्रयास हो चुके हैं। नई चुनौती बनाएँ।",CHALLENGE_NOT_FOUND:"चुनौती नहीं मिली।",WRONG_CHALLENGE:"यह टोकन दूसरी चुनौती का है।",INVALID_TOKEN:"जवाब टोकन गलत है।",INVALID_SIGNATURE:"हस्ताक्षर इस चुनौती से मेल नहीं खाते।",OFFICER_NOT_FOUND:"इस कुंजी का जारी अधिकारी प्रमाणपत्र नहीं मिला।",CREDENTIAL_REVOKED_OR_EXPIRED:"अधिकारी का प्रमाणपत्र रद्द या समाप्त है।",INVALID_CREDENTIAL:"संस्था के प्रमाणपत्र के हस्ताक्षर की पुष्टि नहीं हुई।",ISSUER_REVOKED:"संस्था सक्रिय नहीं है।",VERIFICATION_UNAVAILABLE:"जाँच सेवा उपलब्ध नहीं है। पहचान की पुष्टि नहीं हुई।",RATE_LIMITED:"बहुत अधिक अनुरोध हैं। एक मिनट बाद फिर प्रयास करें।"}},
 ta:{heading:"அழைப்பவரைச் சரிபாருங்கள்",entity:"அழைப்பவர் எந்த நிறுவனத்தைச் சேர்ந்ததாகக் கூறுகிறார்?",category:"கூறப்பட்ட நிறுவன வகை",create:"சவாலை உருவாக்கு",code:"இந்த ஒருமுறை குறியீட்டை அழைப்பவரிடம் சொல்லுங்கள்",challengeId:"சவால் அடையாளம்",expires:"மீதமுள்ள வினாடிகள்",expired:"சவால் காலாவதியானது. புதிய சவாலை உருவாக்குங்கள்.",token:"அதிகாரியின் பதில் டோக்கனை ஒட்டுங்கள்",check:"பதிலைச் சரிபார்",load:"குடிமகனின் சவாலை ஏற்று",sign:"சவாலில் கையொப்பமிடு",copy:"நகலெடு",copied:"நகலெடுக்கப்பட்டது",review:"கையொப்பமிடும் முன் குடிமகன் கூறிய நிறுவனத்தைப் பாருங்கள்",warning:"அடையாளம் அனுமதி அல்ல. ஒப்புதல் பெற்ற செயலுடன் பொருந்தும் கோரிக்கைக்கு மட்டுமே அனுமதி உள்ளது; இங்கு பணம் செலுத்தப்படாது.",scan:"கேமராவில் QR ஐ ஸ்கேன் செய்",stop:"கேமராவை நிறுத்து",cameraError:"கேமரா கிடைக்கவில்லை. HTTPS அல்லது localhost மற்றும் கேமரா அனுமதியைப் பயன்படுத்தவும் அல்லது டோக்கனை ஒட்டவும்.",qr:"அதிகாரி பதிலின் QR",error:"சரிபார்ப்பை முடிக்க முடியவில்லை. விவரங்களையும் சேவை அமைப்பையும் சரிபார்த்து தேவையெனில் புதிய சவால் பெறுங்கள்.",pending:"காத்திருக்கவும்…",
 results:{VERIFIED_AUTHORIZED:"அடையாளமும் அனுமதியும் சரிபார்க்கப்பட்டன",IDENTITY_VERIFIED_NOT_AUTHORIZED:"அடையாளம் சரிபார்க்கப்பட்டது — கோரிக்கைக்கு அனுமதி இல்லை",VERIFIED:"சரிபார்க்கப்பட்டது",NOT_VERIFIED:"சரிபார்க்கப்படவில்லை",MISMATCH:"வகை பொருந்தவில்லை"},reasons:{IDENTITY_VERIFIED:"அதிகாரியின் கையொப்பம், சான்றிதழ் மற்றும் செயலில் உள்ள நிறுவனம் உறுதிசெய்யப்பட்டன.",CATEGORY_MISMATCH:"அதிகாரியின் நிறுவன வகை அழைப்பவர் கூறியதிலிருந்து வேறுபடுகிறது.",CHALLENGE_USED:"இந்தச் சவால் பயன்படுத்தப்பட்டது. புதியதை உருவாக்கவும்.",CHALLENGE_EXPIRED:"சவால் காலாவதியானது. புதியதை உருவாக்கவும்.",ATTEMPTS_EXHAUSTED:"ஐந்து முயற்சிகள் முடிந்தன. புதிய சவால் உருவாக்கவும்.",CHALLENGE_NOT_FOUND:"சவால் கிடைக்கவில்லை.",WRONG_CHALLENGE:"இந்த டோக்கன் வேறு சவாலுக்கானது.",INVALID_TOKEN:"பதில் டோக்கன் செல்லாது.",INVALID_SIGNATURE:"அதிகாரியின் கையொப்பம் இந்தச் சவாலுடன் பொருந்தவில்லை.",OFFICER_NOT_FOUND:"இந்தச் சாவிக்கான அதிகாரிச் சான்றிதழ் இல்லை.",CREDENTIAL_REVOKED_OR_EXPIRED:"அதிகாரியின் சான்றிதழ் ரத்தானது அல்லது காலாவதியானது.",INVALID_CREDENTIAL:"நிறுவனச் சான்றிதழின் கையொப்பத்தை உறுதிசெய்ய முடியவில்லை.",ISSUER_REVOKED:"நிறுவனம் செயலில் இல்லை.",VERIFICATION_UNAVAILABLE:"சரிபார்ப்புச் சேவை கிடைக்கவில்லை. அடையாளம் உறுதிசெய்யப்படவில்லை.",RATE_LIMITED:"அதிக கோரிக்கைகள். ஒரு நிமிடம் கழித்து முயற்சிக்கவும்."}},
};

type IntentCopy={create:string;actions:string;purpose:string;amount:string;payee:string;caseRef:string;cap:string;until:string;payment:string;institutional:string;label:string;savePayee:string;receipt:string;report:string;reportReason:string;reportLogin:string;reported:string;flagged:string;suspended:string;approved:string;pending:string;revoked:string;payeeHint:string;purposes:Record<"information"|"appointment"|"document_request"|"payment",string>};
export const intentMessages:Record<Locale,IntentCopy>={
 en:{create:"Create Official Action",actions:"Official Actions",purpose:"Requested purpose",amount:"Requested amount (INR)",payee:"Requested payee",caseRef:"Case reference",cap:"Maximum amount (INR)",until:"Valid until (within 24 hours)",payment:"Payment allowed",institutional:"I have verified this payee belongs to the institution, not an individual or personal account.",label:"Payee label",savePayee:"Save institutional payee",receipt:"Download signed verdict receipt",report:"Report this verified officer",reportReason:"Why are you reporting this officer?",reportLogin:"Log in to submit a report",reported:"Report recorded for review. Repeat reports from your account count once.",flagged:"Flagged for review",suspended:"Suspended pending review",approved:"Approved",pending:"Pending issuer approval",revoked:"Revoked",payeeHint:"UPI ID or account:IFSC:account-number; leave blank if no payment is requested.",purposes:{information:"Information",appointment:"Appointment",document_request:"Document request (approval required)",payment:"Payment (approval required)"}},
 hi:{create:"आधिकारिक कार्रवाई बनाएँ",actions:"आधिकारिक कार्रवाइयाँ",purpose:"अनुरोध का उद्देश्य",amount:"माँगी गई राशि (INR)",payee:"बताया गया भुगतान प्राप्तकर्ता",caseRef:"मामले का संदर्भ",cap:"अधिकतम राशि (INR)",until:"मान्य अवधि (24 घंटे के अंदर)",payment:"भुगतान की अनुमति",institutional:"मैंने जाँचा है कि यह खाता संस्था का है, किसी व्यक्ति या निजी खाते का नहीं।",label:"प्राप्तकर्ता का नाम",savePayee:"संस्था का प्राप्तकर्ता सहेजें",receipt:"हस्ताक्षरित परिणाम रसीद डाउनलोड करें",report:"सत्यापित अधिकारी की रिपोर्ट करें",reportReason:"आप अधिकारी की रिपोर्ट क्यों कर रहे हैं?",reportLogin:"रिपोर्ट के लिए लॉग इन करें",reported:"रिपोर्ट समीक्षा के लिए दर्ज हुई। आपके दोबारा किए गए अनुरोध एक ही रिपोर्ट गिने जाते हैं।",flagged:"समीक्षा के लिए चिह्नित",suspended:"समीक्षा तक निलंबित",approved:"स्वीकृत",pending:"संस्था की मंज़ूरी लंबित",revoked:"रद्द",payeeHint:"UPI आईडी या account:IFSC:खाता-संख्या; भुगतान न माँगा हो तो खाली छोड़ें।",purposes:{information:"जानकारी",appointment:"मुलाकात",document_request:"दस्तावेज़ अनुरोध (मंज़ूरी ज़रूरी)",payment:"भुगतान (मंज़ूरी ज़रूरी)"}},
 ta:{create:"அதிகாரப்பூர்வ செயலை உருவாக்கு",actions:"அதிகாரப்பூர்வ செயல்கள்",purpose:"கோரிக்கையின் நோக்கம்",amount:"கோரப்பட்ட தொகை (INR)",payee:"கோரப்பட்ட பெறுநர்",caseRef:"வழக்குக் குறிப்பு",cap:"அதிகபட்ச தொகை (INR)",until:"செல்லுபடியாகும் நேரம் (24 மணிநேரத்திற்குள்)",payment:"பணம் செலுத்த அனுமதி",institutional:"இந்தப் பெறுநர் நிறுவனத்திற்குச் சொந்தமானவர், தனிநபர் அல்லது தனிப்பட்ட கணக்கு அல்ல என்பதை சரிபார்த்தேன்.",label:"பெறுநர் பெயர்",savePayee:"நிறுவனப் பெறுநரைச் சேமி",receipt:"கையொப்பமிட்ட முடிவு ரசீதைப் பதிவிறக்கு",report:"சரிபார்க்கப்பட்ட அதிகாரியைப் புகாரளி",reportReason:"இந்த அதிகாரியை ஏன் புகாரளிக்கிறீர்கள்?",reportLogin:"புகாரளிக்க உள்நுழையவும்",reported:"மதிப்பாய்விற்காக புகார் பதிவானது. ஒரே கணக்கின் மீண்டும் வரும் புகார்கள் ஒருமுறை மட்டுமே எண்ணப்படும்.",flagged:"மதிப்பாய்விற்குக் குறிக்கப்பட்டது",suspended:"மதிப்பாய்வு வரை இடைநீக்கம்",approved:"ஒப்புதல் பெற்றது",pending:"நிறுவன ஒப்புதல் நிலுவையில்",revoked:"ரத்து",payeeHint:"UPI அல்லது account:IFSC:கணக்கு-எண்; பணம் கோரப்படாவிட்டால் காலியாக விடவும்.",purposes:{information:"தகவல்",appointment:"சந்திப்பு",document_request:"ஆவணக் கோரிக்கை (ஒப்புதல் தேவை)",payment:"பணம் செலுத்தல் (ஒப்புதல் தேவை)"}},
};
Object.assign(verificationMessages.en.reasons,{ACTION_AUTHORIZED:"Identity and request match an approved official action.",ACTION_NOT_FOUND:"No registered action matches this response.",ACTION_OFFICER_MISMATCH:"This action belongs to another officer or institution.",ACTION_EXPIRED:"The registered action has expired.",ACTION_NOT_APPROVED:"This action has not received the required approval.",PURPOSE_MISMATCH:"The caller's request does not match the registered purpose.",PAYMENT_NOT_ALLOWED:"This action does not allow payment.",PAYEE_NOT_ALLOWLISTED:"This payee is not on the institution's active allowlist. Do not pay.",PAYEE_MISMATCH:"The payee differs from the registered action. Do not pay.",AMOUNT_EXCEEDED:"The requested amount exceeds the approved cap. Do not pay.",OFFICER_SUSPENDED:"This officer is suspended pending review.",UNAUTHENTICATED:"Log in to report a verified officer.",ALREADY_EXISTS:"Your account has already reported this officer."});
Object.assign(verificationMessages.hi.reasons,{ACTION_AUTHORIZED:"पहचान और अनुरोध स्वीकृत आधिकारिक कार्रवाई से मेल खाते हैं।",ACTION_NOT_FOUND:"कोई पंजीकृत कार्रवाई नहीं मिली।",ACTION_OFFICER_MISMATCH:"कार्रवाई किसी दूसरे अधिकारी या संस्था की है।",ACTION_EXPIRED:"कार्रवाई की अवधि समाप्त है।",ACTION_NOT_APPROVED:"कार्रवाई को आवश्यक मंज़ूरी नहीं मिली।",PURPOSE_MISMATCH:"अनुरोध का उद्देश्य मेल नहीं खाता।",PAYMENT_NOT_ALLOWED:"इस कार्रवाई में भुगतान की अनुमति नहीं है।",PAYEE_NOT_ALLOWLISTED:"प्राप्तकर्ता संस्था की सूची में नहीं है। भुगतान न करें।",PAYEE_MISMATCH:"प्राप्तकर्ता कार्रवाई से अलग है। भुगतान न करें।",AMOUNT_EXCEEDED:"राशि स्वीकृत सीमा से अधिक है। भुगतान न करें।",OFFICER_SUSPENDED:"अधिकारी समीक्षा तक निलंबित है।",UNAUTHENTICATED:"रिपोर्ट करने के लिए लॉग इन करें।",ALREADY_EXISTS:"आपके खाते से अधिकारी की रिपोर्ट पहले हो चुकी है।"});
Object.assign(verificationMessages.ta.reasons,{ACTION_AUTHORIZED:"அடையாளமும் கோரிக்கையும் ஒப்புதல் பெற்ற அதிகாரப்பூர்வ செயலுடன் பொருந்துகின்றன.",ACTION_NOT_FOUND:"பதிவுசெய்யப்பட்ட செயல் இல்லை.",ACTION_OFFICER_MISMATCH:"செயல் வேறொரு அதிகாரி அல்லது நிறுவனத்திற்கானது.",ACTION_EXPIRED:"செயல் காலாவதியானது.",ACTION_NOT_APPROVED:"தேவையான ஒப்புதல் கிடைக்கவில்லை.",PURPOSE_MISMATCH:"கோரிக்கையின் நோக்கம் பொருந்தவில்லை.",PAYMENT_NOT_ALLOWED:"இந்தச் செயலுக்கு பணம் செலுத்த அனுமதி இல்லை.",PAYEE_NOT_ALLOWLISTED:"பெறுநர் நிறுவனப் பட்டியலில் இல்லை. பணம் செலுத்த வேண்டாம்.",PAYEE_MISMATCH:"பெறுநர் பதிவுசெய்யப்பட்ட செயலுடன் பொருந்தவில்லை. பணம் செலுத்த வேண்டாம்.",AMOUNT_EXCEEDED:"தொகை அனுமதிக்கப்பட்ட வரம்பை மீறுகிறது. பணம் செலுத்த வேண்டாம்.",OFFICER_SUSPENDED:"அதிகாரி மதிப்பாய்வு வரை இடைநீக்கப்பட்டுள்ளார்.",UNAUTHENTICATED:"புகாரளிக்க உள்நுழையவும்.",ALREADY_EXISTS:"உங்கள் கணக்கு ஏற்கனவே புகாரளித்துள்ளது."});

type VaultCopy={heading:string;verify:string;title:string;create:string;select:string;privacy:string;verifyPrivacy:string;kind:string;files:string;text:string;add:string;original:string;export:string;anchor:string;transaction:string;anchorTime:string;chain:string;caseId:string;manifestHash:string;items:string;complaint:string;draftHeading:string;draftNotice:string;name:string;contact:string;incidentAt:string;description:string;suspect:string;amount:string;transactionRefs:string;generate:string;print:string;downloadDraft:string;instructions:string;limitations:string;manifestFile:string;drop:string;check:string;changed:string;unchanged:string;unanchored:string;pending:string;error:string;states:Record<"draft"|"anchoring"|"anchored",string>;kinds:Record<"screenshot"|"transcript"|"call_metadata"|"verdict_receipt"|"analyzer_result",string>;errors:Record<string,string>};
export const vaultMessages:Record<Locale,VaultCopy>={
  "en": {
    "heading": "Evidence Vault",
    "verify": "Verify evidence integrity",
    "title": "Case title (metadata saved to your account)",
    "create": "Create case",
    "select": "Select case",
    "privacy": "Raw files and text stay in this browser session. Only hashes and metadata are saved. Keep your originals and export the manifest; refreshing clears local text and file copies.",
    "verifyPrivacy": "The file is hashed locally. Only the manifest of hashes and metadata is sent for an on-chain check. Exported timestamps are not trusted.",
    "kind": "Evidence type",
    "files": "Choose files (up to 20 per batch, 25 MB each)",
    "text": "Paste transcript or call metadata (entered by you)",
    "add": "Hash and add evidence",
    "original": "Save local original",
    "export": "Download manifest",
    "anchor": "Anchor frozen manifest / reconcile",
    "transaction": "On-chain transaction",
    "anchorTime": "Anchored at block time",
    "chain": "Chain / registry",
    "caseId": "Case ID",
    "manifestHash": "Manifest SHA-256",
    "items": "Evidence hashes",
    "complaint": "Generate complaint draft",
    "draftHeading": "DRAFT — cybercrime complaint for review",
    "draftNotice": "This is a draft only. Details stay in your browser. Review and correct it before filing; nothing is submitted automatically.",
    "name": "Complainant name",
    "contact": "Contact / address",
    "incidentAt": "Incident date and time / timeline",
    "description": "What happened (facts you personally know)",
    "suspect": "Suspect phone / UPI / account / other identifiers",
    "amount": "Amount lost or requested (INR)",
    "transactionRefs": "Transaction references / bank details",
    "generate": "Generate complaint draft",
    "print": "Print / Save as PDF",
    "downloadDraft": "Download draft text",
    "instructions": "For immediate reporting of financial cyber fraud, call 1930. You may file a complaint yourself at cybercrime.gov.in. Keep incident details, suspect identifiers, transaction references, and original evidence ready. Follow the official portal instructions and retain the acknowledgement number.",
    "limitations": "Anchoring proves integrity and time of a hash, not that the content is true or legally admissible. A matching file is unchanged relative to the manifest anchored at the displayed time. This does not authenticate the caller or file creator.",
    "manifestFile": "Choose exported manifest JSON",
    "drop": "Drop an original file here, or choose a file",
    "check": "Check file against on-chain manifest",
    "changed": "FILE DOES NOT MATCH",
    "unchanged": "UNCHANGED SINCE ANCHOR",
    "unanchored": "NOT ANCHORED — no confirmed timestamp",
    "pending": "Working…",
    "error": "Unable to complete this action. Check configuration and try again.",
    "states": {
      "draft": "Draft",
      "anchoring": "Frozen / awaiting chain confirmation",
      "anchored": "Anchored"
    },
    "kinds": {
      "screenshot": "Screenshot",
      "transcript": "Transcript",
      "call_metadata": "Call metadata",
      "verdict_receipt": "Verdict receipt",
      "analyzer_result": "Analyzer result"
    },
    "errors": {
      "FILE_TOO_LARGE": "Maximum file size is 25 MB.",
      "MANIFEST_TAMPERED": "The manifest hash does not match. Use your original exported manifest.",
      "ANCHOR_PENDING": "Transaction pending. Reconcile later; keep its transaction hash.",
      "RATE_LIMITED": "Too many requests. Try again in a minute.",
      "CONFLICT": "Case is frozen, unavailable, or contains too many items.",
      "INVALID_INPUT": "Check the input, file count and manifest format.",
      "CONFIG": "Configure the deployed registry, RPC and relayer.",
      "NOT_OWNER": "The relayer must own this registry.",
      "RPC_UNAVAILABLE": "The chain cannot be reached. Try again later.",
      "TRANSACTION_PENDING": "Confirmation is uncertain. Reconcile this case before retrying."
    }
  },
  "hi": {
    "heading": "साक्ष्य संग्रह",
    "verify": "साक्ष्य की अखंडता जाँचें",
    "title": "मामले का शीर्षक (खाते में सहेजा जाएगा)",
    "create": "मामला बनाएँ",
    "select": "मामला चुनें",
    "privacy": "फ़ाइलें और पाठ इसी ब्राउज़र सत्र में रहते हैं। केवल हैश और मेटाडेटा सहेजे जाते हैं। मूल फ़ाइलें और मैनिफेस्ट रखें; रीफ़्रेश करने पर स्थानीय पाठ हटता है।",
    "verifyPrivacy": "फ़ाइल का हैश स्थानीय रूप से बनता है। केवल हैश वाला मैनिफेस्ट चेन जाँच के लिए भेजा जाता है। निर्यात की तारीख पर भरोसा नहीं किया जाता।",
    "kind": "साक्ष्य का प्रकार",
    "files": "फ़ाइलें चुनें (20 प्रति बैच, 25 MB प्रति फ़ाइल)",
    "text": "प्रतिलिपि या कॉल का विवरण लिखें",
    "add": "हैश बनाकर जोड़ें",
    "original": "स्थानीय मूल सहेजें",
    "export": "मैनिफेस्ट डाउनलोड करें",
    "anchor": "मैनिफेस्ट एंकर करें / स्थिति जाँचें",
    "transaction": "चेन लेनदेन",
    "anchorTime": "ब्लॉक समय पर एंकर",
    "chain": "चेन / रजिस्ट्री",
    "caseId": "मामला आईडी",
    "manifestHash": "मैनिफेस्ट SHA-256",
    "items": "साक्ष्य हैश",
    "complaint": "शिकायत का मसौदा बनाएँ",
    "draftHeading": "मसौदा — समीक्षा के लिए साइबर अपराध शिकायत",
    "draftNotice": "यह केवल मसौदा है। विवरण आपके ब्राउज़र में रहते हैं। जमा करने से पहले जाँचें; कोई स्वचालित शिकायत नहीं होगी।",
    "name": "शिकायतकर्ता का नाम",
    "contact": "संपर्क / पता",
    "incidentAt": "घटना का दिन और समय / क्रम",
    "description": "क्या हुआ (आपके ज्ञात तथ्य)",
    "suspect": "संदिग्ध फोन / UPI / खाता / पहचान",
    "amount": "नुकसान या माँगी गई राशि (INR)",
    "transactionRefs": "लेनदेन संदर्भ / बैंक विवरण",
    "generate": "शिकायत का मसौदा बनाएँ",
    "print": "प्रिंट / PDF सहेजें",
    "downloadDraft": "मसौदा पाठ डाउनलोड करें",
    "instructions": "वित्तीय साइबर धोखाधड़ी की तत्काल रिपोर्ट के लिए 1930 पर कॉल करें। cybercrime.gov.in पर स्वयं शिकायत करें। घटना, संदिग्ध पहचान, लेनदेन संदर्भ और मूल साक्ष्य तैयार रखें। आधिकारिक निर्देशों का पालन करें और पावती संख्या रखें।",
    "limitations": "एंकर हैश की अखंडता और समय दर्शाता है, सामग्री की सच्चाई या कानूनी स्वीकार्यता नहीं। मिलती फ़ाइल उस समय के मैनिफेस्ट के अनुरूप है। यह कॉलर की पहचान नहीं सिद्ध करता।",
    "manifestFile": "निर्यात किया मैनिफेस्ट JSON चुनें",
    "drop": "मूल फ़ाइल छोड़ें या चुनें",
    "check": "फ़ाइल और चेन मैनिफेस्ट जाँचें",
    "changed": "फ़ाइल नहीं मिलती",
    "unchanged": "एंकर के बाद अपरिवर्तित",
    "unanchored": "एंकर की पुष्टि नहीं",
    "pending": "कृपया प्रतीक्षा करें…",
    "error": "कार्य पूरा नहीं हुआ। सेटअप जाँचें और पुनः प्रयास करें।",
    "states": {
      "draft": "मसौदा",
      "anchoring": "स्थिर / चेन पुष्टि लंबित",
      "anchored": "एंकर किया"
    },
    "kinds": {
      "screenshot": "स्क्रीनशॉट",
      "transcript": "प्रतिलिपि",
      "call_metadata": "कॉल विवरण",
      "verdict_receipt": "परिणाम रसीद",
      "analyzer_result": "विश्लेषण परिणाम"
    },
    "errors": {
      "FILE_TOO_LARGE": "अधिकतम फ़ाइल आकार 25 MB है।",
      "MANIFEST_TAMPERED": "मैनिफेस्ट हैश नहीं मिलता। मूल निर्यात उपयोग करें।",
      "ANCHOR_PENDING": "लेनदेन लंबित है। बाद में स्थिति जाँचें।",
      "RATE_LIMITED": "बहुत अधिक अनुरोध। एक मिनट बाद प्रयास करें।",
      "CONFLICT": "मामला स्थिर, अनुपलब्ध या भरा है।",
      "INVALID_INPUT": "विवरण और मैनिफेस्ट जाँचें।",
      "CONFIG": "रजिस्ट्री, RPC और रिलेयर सेट करें।",
      "NOT_OWNER": "रिलेयर रजिस्ट्री का मालिक होना चाहिए।",
      "RPC_UNAVAILABLE": "चेन उपलब्ध नहीं है।",
      "TRANSACTION_PENDING": "पुष्टि अनिश्चित है। पहले स्थिति जाँचें।"
    }
  },
  "ta": {
    "heading": "சான்றுகள் பெட்டகம்",
    "verify": "சான்றின் ஒருமைப்பாட்டைச் சரிபார்",
    "title": "வழக்குத் தலைப்பு (கணக்கில் சேமிக்கப்படும்)",
    "create": "வழக்கை உருவாக்கு",
    "select": "வழக்கைத் தேர்ந்தெடு",
    "privacy": "கோப்புகளும் உரையும் இந்த உலாவி அமர்வில் மட்டுமே உள்ளன. ஹாஷும் மெட்டாடேட்டாவும் மட்டும் சேமிக்கப்படும். அசல் கோப்புகளையும் மானிஃபெஸ்டையும் வைத்திருங்கள்; புதுப்பித்தால் உள்ளூர் உரை அழியும்.",
    "verifyPrivacy": "கோப்பின் ஹாஷ் உலாவியில் உருவாகும். ஹாஷ் மானிஃபெஸ்ட் மட்டும் சங்கிலிச் சரிபார்ப்பிற்கு அனுப்பப்படும். ஏற்றுமதி நேரம் நம்பப்படாது.",
    "kind": "சான்று வகை",
    "files": "கோப்புகளைத் தேர்ந்தெடு (20, தலா 25 MB)",
    "text": "உரை அல்லது அழைப்பு விவரங்களை உள்ளிடு",
    "add": "ஹாஷ் செய்து சேர்",
    "original": "உள்ளூர் அசலைச் சேமி",
    "export": "மானிஃபெஸ்ட் பதிவிறக்கு",
    "anchor": "மானிஃபெஸ்டை பதிவு செய் / நிலை சரிபார்",
    "transaction": "சங்கிலி பரிவர்த்தனை",
    "anchorTime": "பிளாக் நேரத்தில் பதிவு",
    "chain": "சங்கிலி / பதிவகம்",
    "caseId": "வழக்கு அடையாளம்",
    "manifestHash": "மானிஃபெஸ்ட் SHA-256",
    "items": "சான்று ஹாஷ்கள்",
    "complaint": "புகார் வரைவை உருவாக்கு",
    "draftHeading": "வரைவு — மதிப்பாய்விற்கான இணையக் குற்றப் புகார்",
    "draftNotice": "இது வரைவு மட்டுமே. விவரங்கள் உலாவியில் இருக்கும். சமர்ப்பிக்கும் முன் சரிபார்க்கவும்; தானாகப் புகார் அனுப்பப்படாது.",
    "name": "புகார்தாரர் பெயர்",
    "contact": "தொடர்பு / முகவரி",
    "incidentAt": "சம்பவ நேரம் / வரிசை",
    "description": "என்ன நடந்தது (உங்களுக்கு தெரிந்த உண்மைகள்)",
    "suspect": "சந்தேக நபர் தொலைபேசி / UPI / கணக்கு",
    "amount": "இழந்த அல்லது கேட்ட தொகை (INR)",
    "transactionRefs": "பரிவர்த்தனை / வங்கி விவரங்கள்",
    "generate": "புகார் வரைவை உருவாக்கு",
    "print": "அச்சிடு / PDF சேமி",
    "downloadDraft": "வரைவு உரையை பதிவிறக்கு",
    "instructions": "நிதி இணைய மோசடியை உடனடியாகப் புகாரளிக்க 1930 அழைக்கவும். cybercrime.gov.in இல் நீங்களே புகார் அளிக்கலாம். சம்பவ விவரங்கள், அடையாளங்கள், பரிவர்த்தனை விவரங்கள் மற்றும் அசல் சான்றுகளை வைத்திருங்கள். அதிகாரப்பூர்வ வழிமுறைகளைப் பின்பற்றி ஒப்புகை எண்ணைச் சேமிக்கவும்.",
    "limitations": "பதிவு ஹாஷின் ஒருமைப்பாடு மற்றும் நேரத்தையே நிரூபிக்கிறது; உள்ளடக்கத்தின் உண்மை அல்லது சட்ட ஏற்றுக்கொள்ளுதலை அல்ல. கோப்பு பதிவு செய்யப்பட்ட மானிஃபெஸ்டுடன் பொருந்துகிறது. அழைப்பாளரின் அடையாளத்தை இது நிரூபிக்காது.",
    "manifestFile": "ஏற்றுமதி மானிஃபெஸ்ட் JSON தேர்ந்தெடு",
    "drop": "அசல் கோப்பை விடவும் அல்லது தேர்ந்தெடுக்கவும்",
    "check": "கோப்பை சங்கிலி மானிஃபெஸ்டுடன் சரிபார்",
    "changed": "கோப்பு பொருந்தவில்லை",
    "unchanged": "பதிவு முதல் மாறவில்லை",
    "unanchored": "பதிவு உறுதி செய்யப்படவில்லை",
    "pending": "காத்திருக்கவும்…",
    "error": "செயலை முடிக்க முடியவில்லை. அமைப்பைச் சரிபார்க்கவும்.",
    "states": {
      "draft": "வரைவு",
      "anchoring": "உறைந்தது / உறுதி நிலுவை",
      "anchored": "பதிவு செய்யப்பட்டது"
    },
    "kinds": {
      "screenshot": "திரைப்பிடிப்பு",
      "transcript": "உரை",
      "call_metadata": "அழைப்பு விவரம்",
      "verdict_receipt": "முடிவு ரசீது",
      "analyzer_result": "பகுப்பாய்வு முடிவு"
    },
    "errors": {
      "FILE_TOO_LARGE": "அதிகபட்ச கோப்பு அளவு 25 MB.",
      "MANIFEST_TAMPERED": "மானிஃபெஸ்ட் ஹாஷ் பொருந்தவில்லை.",
      "ANCHOR_PENDING": "பரிவர்த்தனை நிலுவையில் உள்ளது.",
      "RATE_LIMITED": "ஒரு நிமிடம் கழித்து முயற்சிக்கவும்.",
      "CONFLICT": "வழக்கு உறைந்தது அல்லது கிடைக்கவில்லை.",
      "INVALID_INPUT": "உள்ளீடு மற்றும் மானிஃபெஸ்டைச் சரிபார்.",
      "CONFIG": "பதிவகம், RPC மற்றும் ரிலேயரை அமைக்கவும்.",
      "NOT_OWNER": "ரிலேயர் பதிவக உரிமையாளராக இருக்க வேண்டும்.",
      "RPC_UNAVAILABLE": "சங்கிலி கிடைக்கவில்லை.",
      "TRANSACTION_PENDING": "உறுதி தெரியவில்லை. முதலில் நிலை சரிபார்."
    }
  }
};


type AssistCopy={analyze:string;live:string;upi:string;guardian:string;text:string;localPrivacy:string;noCall:string;rules:string;dictate:string;speechWarning:string;speechConsent:string;start:string;stop:string;listening:string;speechSource:string;aiPrivacy:string;aiConsent:string;ai:string;pending:string;error:string;notProof:string;score:string;export:string;demo:string;guardPrivacy:string;latest:string;payee:string;amount:string;simulate:string;threshold:string;registryCount:string;cooling:string;pressure:string;prompt:string;noTriggers:string;alertFailed:string;alertWebhook:string;alertLocal:string;cancel:string;continue:string;cancelled:string;continued:string;logged:string;again:string;expired:string;noAlerts:string;risks:Record<"LOW"|"MEDIUM"|"HIGH",string>;providers:Record<"heuristics"|"hybrid"|"heuristics-fallback",string>;guardReasons:Record<"AMOUNT"|"REGISTRY"|"ANALYZER",string>;tactics:Record<import("./heuristics").AnalysisResult["tactics"][number],string>;errors:Record<string,string>};
export const assistMessages:Record<Locale,AssistCopy>={
  "en": {
    "analyze": "Analyze a message",
    "live": "Live Assist",
    "upi": "SIMULATED UPI Guard",
    "guardian": "Family Guardian",
    "text": "Paste or enter what the caller said",
    "localPrivacy": "Rules run in your browser. Local analysis sends no text over the network and needs no API keys. Only the latest risk label and time are kept in this browser tab.",
    "noCall": "User-initiated paste or dictation only. This page cannot hear or monitor a phone call and does not run an on-device ML model.",
    "rules": "Analyze locally — no network",
    "dictate": "Optional browser dictation",
    "speechWarning": "Browser speech recognition may send microphone audio to a cloud service, including on Chrome. It may require an internet connection. This is not live call-audio access.",
    "speechConsent": "I understand audio may be processed by the browser's cloud service.",
    "start": "Start dictation",
    "stop": "Stop dictation",
    "listening": "Microphone dictation is active",
    "speechSource": "Browser speech recognition documentation",
    "aiPrivacy": "Optional AI sends this text to our server for redaction. Only redacted text is sent to the configured provider when needed. Raw text is not saved to the database.",
    "aiConsent": "I consent to server-side, optional AI analysis.",
    "ai": "Request optional AI analysis",
    "pending": "Working…",
    "error": "Unable to complete this request. Local rules remain available.",
    "notProof": "This is a rules-based risk signal, not proof that a contact is genuine or a crime occurred.",
    "score": "Risk score",
    "export": "Download analysis result",
    "demo": "SIMULATION ONLY. No UPI payment is initiated or intercepted. Real interception requires UPI-app or bank integration.",
    "guardPrivacy": "The server hashes the entered payee before logging. This demo uses registry reports and a client-reported latest analyzer risk; it does not authorize a payment.",
    "latest": "Latest analyzer risk (this tab, valid for 30 minutes)",
    "payee": "Demo UPI payee",
    "amount": "Demo amount (INR)",
    "simulate": "Check simulated payment",
    "threshold": "Cooling threshold",
    "registryCount": "Reports in scam registry",
    "cooling": "60-second cooling-off pause",
    "pressure": "Is someone on a call telling you to do this?",
    "prompt": "Pause the conversation. Contact the institution independently. Never transfer funds merely because a caller pressures you.",
    "noTriggers": "No cooling trigger found. This does not make a payment safe.",
    "alertFailed": "Guardian demo alert recorded, but webhook delivery failed or is uncertain.",
    "alertWebhook": "Guardian demo webhook acknowledged. No real payment occurred.",
    "alertLocal": "Guardian demo alert recorded in-app. No external family contact is configured.",
    "cancel": "Cancel simulation",
    "continue": "Continue simulation after the pause",
    "cancelled": "Simulation cancelled. No money moved.",
    "continued": "Simulation continued. No money moved.",
    "logged": "Your choice was recorded in the database.",
    "again": "Start another simulation",
    "expired": "Demo session expired. Start again.",
    "noAlerts": "No Guardian demo alerts yet.",
    "risks": {
      "LOW": "LOW RISK",
      "MEDIUM": "CAUTION",
      "HIGH": "HIGH RISK"
    },
    "providers": {
      "heuristics": "Deterministic rules",
      "hybrid": "Rules + optional AI",
      "heuristics-fallback": "Rules only — AI unavailable or invalid"
    },
    "guardReasons": {
      "AMOUNT": "Amount meets or exceeds the threshold",
      "REGISTRY": "Payee has scam-registry reports",
      "ANALYZER": "Latest analyzer result is HIGH RISK"
    },
    "tactics": {
      "DIGITAL_ARREST": "Claims of digital arrest",
      "SAFE_ACCOUNT": "Transfer to a supposedly safe account",
      "SECRECY_PAYMENT": "Secrecy combined with payment",
      "CREDENTIAL_REQUEST": "Request for OTP, PIN or password",
      "THREAT": "Arrest or legal threats",
      "URGENCY": "Urgent pressure",
      "PAYMENT": "Payment request",
      "AUTHORITY": "Claims official authority",
      "PRIZE_FEE": "Fee to collect a prize",
      "OTHER_WARNING": "Additional suspicious tactic",
      "ISOLATION": "Isolation or secrecy",
      "SUSPICIOUS_LINK": "Suspicious link"
    },
    "errors": {
      "SPEECH_UNAVAILABLE": "Dictation is not supported here. Paste or type instead.",
      "SPEECH_FAILED": "Dictation could not start or stopped. Check microphone permission or type instead.",
      "RATE_LIMITED": "Too many requests. Try again in a minute.",
      "REGISTRY_CONFIG": "Configure the server registry pepper to enable lookup and demo logging.",
      "GUARD_CONFIG": "Configure a positive UPI cooling threshold.",
      "CONFLICT": "The server rejected the choice: the pause may be unfinished, the session expired, or a choice already recorded.",
      "INVALID_INPUT": "Enter a valid UPI ID and positive amount with at most two decimal places.",
      "AUTH_UNAVAILABLE": "Account validation is unavailable. Try again later.",
      "DATABASE_UNAVAILABLE": "Database logging is unavailable. No demo completion is claimed."
    }
  },
  "hi": {
    "analyze": "संदेश जाँचें",
    "live": "लाइव सहायता",
    "upi": "सिमुलेटेड UPI सुरक्षा",
    "guardian": "परिवार गार्जियन",
    "text": "कॉलर ने क्या कहा लिखें या पेस्ट करें",
    "localPrivacy": "नियम आपके ब्राउज़र में चलते हैं। स्थानीय जाँच पाठ नेटवर्क पर नहीं भेजती और API कुंजी नहीं चाहिए। इस टैब में केवल जोखिम और समय रहते हैं।",
    "noCall": "सिर्फ आपके पेस्ट या डिक्टेशन से। यह पृष्ठ फोन कॉल नहीं सुनता और डिवाइस पर ML मॉडल नहीं चलाता।",
    "rules": "स्थानीय जाँच — बिना नेटवर्क",
    "dictate": "वैकल्पिक ब्राउज़र डिक्टेशन",
    "speechWarning": "ब्राउज़र वॉइस पहचान Chrome सहित क्लाउड पर माइक्रोफोन ऑडियो भेज सकती है। इंटरनेट की ज़रूरत हो सकती है। यह फोन कॉल ऑडियो नहीं सुनता।",
    "speechConsent": "मैं समझता हूँ कि ऑडियो ब्राउज़र की क्लाउड सेवा में जा सकता है।",
    "start": "डिक्टेशन शुरू करें",
    "stop": "डिक्टेशन रोकें",
    "listening": "माइक्रोफोन डिक्टेशन चालू है",
    "speechSource": "ब्राउज़र वॉइस पहचान दस्तावेज़",
    "aiPrivacy": "वैकल्पिक AI पाठ सर्वर को भेजता है जहाँ पहचान मिटाई जाती है। ज़रूरत पर केवल संशोधित पाठ AI प्रदाता को जाता है। मूल पाठ डेटाबेस में नहीं सहेजा जाता।",
    "aiConsent": "मैं वैकल्पिक सर्वर AI जाँच की अनुमति देता हूँ।",
    "ai": "वैकल्पिक AI जाँच",
    "pending": "कृपया प्रतीक्षा करें…",
    "error": "अनुरोध पूरा नहीं हुआ। स्थानीय नियम उपलब्ध हैं।",
    "notProof": "यह नियमों का जोखिम संकेत है, संपर्क की सच्चाई या अपराध का प्रमाण नहीं।",
    "score": "जोखिम अंक",
    "export": "विश्लेषण डाउनलोड करें",
    "demo": "केवल सिमुलेशन। कोई UPI भुगतान शुरू या रोका नहीं जाता। असली नियंत्रण के लिए UPI ऐप या बैंक एकीकरण चाहिए।",
    "guardPrivacy": "सर्वर लॉग से पहले प्राप्तकर्ता का हैश बनाता है। डेमो रिपोर्ट और ब्राउज़र के हालिया जोखिम का उपयोग करता है; भुगतान की अनुमति नहीं देता।",
    "latest": "हालिया जोखिम (इस टैब में 30 मिनट)",
    "payee": "डेमो UPI प्राप्तकर्ता",
    "amount": "डेमो राशि (INR)",
    "simulate": "डेमो भुगतान जाँचें",
    "threshold": "रुकने की राशि सीमा",
    "registryCount": "रजिस्ट्री रिपोर्ट",
    "cooling": "60 सेकंड का विराम",
    "pressure": "क्या कोई कॉल पर आपको ऐसा करने को कह रहा है?",
    "prompt": "बातचीत रोकें। संस्था से स्वयं संपर्क करें। कॉलर के दबाव में पैसे न भेजें।",
    "noTriggers": "रुकने का कारण नहीं मिला। इससे भुगतान सुरक्षित नहीं हो जाता।",
    "alertFailed": "डेमो अलर्ट दर्ज हुआ, वेबहुक भेजना असफल या अनिश्चित है।",
    "alertWebhook": "डेमो वेबहुक स्वीकार हुआ। कोई असली भुगतान नहीं हुआ।",
    "alertLocal": "ऐप में डेमो अलर्ट दर्ज हुआ। बाहरी परिवार संपर्क सेट नहीं है।",
    "cancel": "सिमुलेशन रद्द करें",
    "continue": "विराम के बाद सिमुलेशन जारी रखें",
    "cancelled": "सिमुलेशन रद्द। पैसा नहीं गया।",
    "continued": "सिमुलेशन जारी। पैसा नहीं गया।",
    "logged": "आपका चुनाव डेटाबेस में दर्ज हुआ।",
    "again": "नया सिमुलेशन",
    "expired": "डेमो समाप्त। फिर शुरू करें।",
    "noAlerts": "अभी डेमो अलर्ट नहीं हैं।",
    "risks": {
      "LOW": "कम जोखिम",
      "MEDIUM": "सावधानी",
      "HIGH": "उच्च जोखिम"
    },
    "providers": {
      "heuristics": "स्थानीय नियम",
      "hybrid": "नियम + वैकल्पिक AI",
      "heuristics-fallback": "केवल नियम — AI अनुपलब्ध या अमान्य"
    },
    "guardReasons": {
      "AMOUNT": "राशि सीमा के बराबर या अधिक",
      "REGISTRY": "प्राप्तकर्ता के खिलाफ रिपोर्ट",
      "ANALYZER": "हालिया विश्लेषण उच्च जोखिम"
    },
    "tactics": {
      "DIGITAL_ARREST": "डिजिटल गिरफ्तारी का दावा",
      "SAFE_ACCOUNT": "कथित सुरक्षित खाते में पैसे",
      "SECRECY_PAYMENT": "गोपनीयता और भुगतान",
      "CREDENTIAL_REQUEST": "OTP, PIN या पासवर्ड माँगना",
      "THREAT": "गिरफ्तारी या कानूनी धमकी",
      "URGENCY": "जल्दी का दबाव",
      "PAYMENT": "पैसे माँगना",
      "AUTHORITY": "अधिकारी होने का दावा",
      "PRIZE_FEE": "इनाम के लिए शुल्क",
      "OTHER_WARNING": "अन्य संदिग्ध रणनीति",
      "ISOLATION": "अलगाव या गोपनीयता का दबाव",
      "SUSPICIOUS_LINK": "संदिग्ध लिंक"
    },
    "errors": {
      "SPEECH_UNAVAILABLE": "डिक्टेशन उपलब्ध नहीं। लिखें या पेस्ट करें।",
      "SPEECH_FAILED": "डिक्टेशन रुका। माइक्रोफोन अनुमति जाँचें।",
      "RATE_LIMITED": "एक मिनट बाद प्रयास करें।",
      "REGISTRY_CONFIG": "रजिस्ट्री पेपर सेट करें।",
      "GUARD_CONFIG": "धनात्मक राशि सीमा सेट करें।",
      "CONFLICT": "विराम अधूरा, सत्र समाप्त या चुनाव पहले दर्ज है।",
      "INVALID_INPUT": "सही UPI और धनात्मक राशि लिखें।",
      "AUTH_UNAVAILABLE": "खाता जाँच उपलब्ध नहीं।",
      "DATABASE_UNAVAILABLE": "डेटाबेस लॉग उपलब्ध नहीं।"
    }
  },
  "ta": {
    "analyze": "செய்தியைச் சரிபார்",
    "live": "நேரடி உதவி",
    "upi": "UPI பாதுகாப்பு உருவகப்படுத்தல்",
    "guardian": "குடும்ப பாதுகாவலர்",
    "text": "அழைப்பாளர் சொன்னதை ஒட்டவும் அல்லது எழுதவும்",
    "localPrivacy": "விதிகள் உலாவியில் இயங்கும். உள்ளூர் பகுப்பாய்வு உரையை இணையத்தில் அனுப்பாது; API விசை தேவையில்லை. ஆபத்து மற்றும் நேரம் மட்டும் இந்தத் தாவலில் இருக்கும்.",
    "noCall": "நீங்கள் ஒட்டும் உரை அல்லது உச்சரிப்பு மட்டுமே. தொலைபேசி அழைப்பை இந்தப் பக்கம் கேட்காது; சாதனத்தில் ML மாதிரி இயங்காது.",
    "rules": "உள்ளூரில் சரிபார் — இணையம் வேண்டாம்",
    "dictate": "விருப்ப உலாவி உச்சரிப்பு",
    "speechWarning": "Chrome உள்ளிட்ட உலாவிகளில் குரல் அறிதல் ஒலியை மேக சேவைக்கு அனுப்பலாம். இணையம் தேவைப்படலாம். இது தொலைபேசி அழைப்பு ஒலியை அணுகாது.",
    "speechConsent": "ஒலி உலாவியின் மேக சேவையில் செயலாக்கப்படலாம் என்பதை அறிகிறேன்.",
    "start": "உச்சரிப்பைத் தொடங்கு",
    "stop": "உச்சரிப்பை நிறுத்து",
    "listening": "மைக்ரோஃபோன் உச்சரிப்பு செயலில் உள்ளது",
    "speechSource": "உலாவி குரல் அறிதல் ஆவணம்",
    "aiPrivacy": "விருப்ப AI உரையை சர்வருக்கு அனுப்பி அடையாளங்களை மறைக்கும். தேவைப்பட்டால் மறைத்த உரை மட்டுமே AI வழங்குநருக்கு அனுப்பப்படும். அசல் உரை தரவுத்தளத்தில் சேமிக்கப்படாது.",
    "aiConsent": "விருப்ப சர்வர் AI பகுப்பாய்வை அனுமதிக்கிறேன்.",
    "ai": "விருப்ப AI பகுப்பாய்வு",
    "pending": "காத்திருக்கவும்…",
    "error": "கோரிக்கையை முடிக்க முடியவில்லை. உள்ளூர் விதிகள் கிடைக்கும்.",
    "notProof": "இது ஆபத்து குறிப்பு மட்டுமே; தொடர்பின் உண்மை அல்லது குற்றத்திற்கு சான்றல்ல.",
    "score": "ஆபத்து மதிப்பு",
    "export": "பகுப்பாய்வைப் பதிவிறக்கு",
    "demo": "உருவகப்படுத்தல் மட்டும். UPI பணம் அனுப்பப்படவோ தடுக்கப்படவோ இல்லை. உண்மையான தலையீட்டிற்கு UPI செயலி அல்லது வங்கி இணைப்பு தேவை.",
    "guardPrivacy": "சர்வர் பெறுநரை ஹாஷ் செய்து பதிவுசெய்யும். டெமோ புகார் மற்றும் உலாவி ஆபத்தைப் பயன்படுத்தும்; பணம் செலுத்த அனுமதி அளிக்காது.",
    "latest": "சமீபத்திய ஆபத்து (இந்தத் தாவலில் 30 நிமிடம்)",
    "payee": "டெமோ UPI பெறுநர்",
    "amount": "டெமோ தொகை (INR)",
    "simulate": "டெமோ பணத்தைச் சரிபார்",
    "threshold": "இடைநிறுத்த வரம்பு",
    "registryCount": "பதிவக புகார்கள்",
    "cooling": "60 விநாடி இடைநிறுத்தம்",
    "pressure": "தொலைபேசியில் யாராவது இதைச் செய்யச் சொல்கிறார்களா?",
    "prompt": "உரையாடலை நிறுத்துங்கள். நிறுவனத்தைத் தனியாகத் தொடர்புகொள்ளுங்கள். அழைப்பாளரின் அழுத்தத்தால் பணம் அனுப்பாதீர்கள்.",
    "noTriggers": "இடைநிறுத்த காரணம் இல்லை. இது பணம் செலுத்துவது பாதுகாப்பானது எனக் குறிக்காது.",
    "alertFailed": "டெமோ எச்சரிக்கை பதிவானது; வெப்ஹுக் தோல்வி அல்லது உறுதியில்லை.",
    "alertWebhook": "டெமோ வெப்ஹுக் ஏற்கப்பட்டது. பணம் செலுத்தப்படவில்லை.",
    "alertLocal": "செயலியில் டெமோ எச்சரிக்கை பதிவானது. வெளிப்புற குடும்ப தொடர்பு அமைக்கப்படவில்லை.",
    "cancel": "உருவகப்படுத்தலை ரத்துசெய்",
    "continue": "இடைநிறுத்தத்திற்குப் பின் தொடர்க",
    "cancelled": "டெமோ ரத்து. பணம் நகரவில்லை.",
    "continued": "டெமோ தொடர்ந்தது. பணம் நகரவில்லை.",
    "logged": "உங்கள் தேர்வு தரவுத்தளத்தில் பதிவானது.",
    "again": "புதிய உருவகப்படுத்தல்",
    "expired": "டெமோ காலாவதி. மீண்டும் தொடங்கு.",
    "noAlerts": "இன்னும் டெமோ எச்சரிக்கைகள் இல்லை.",
    "risks": {
      "LOW": "குறைந்த ஆபத்து",
      "MEDIUM": "எச்சரிக்கை",
      "HIGH": "அதிக ஆபத்து"
    },
    "providers": {
      "heuristics": "உள்ளூர் விதிகள்",
      "hybrid": "விதிகள் + விருப்ப AI",
      "heuristics-fallback": "விதிகள் மட்டும் — AI கிடைக்கவில்லை"
    },
    "guardReasons": {
      "AMOUNT": "தொகை வரம்பை அடைகிறது",
      "REGISTRY": "பெறுநருக்கு எதிராக புகார்கள் உள்ளன",
      "ANALYZER": "சமீபத்திய பகுப்பாய்வு அதிக ஆபத்து"
    },
    "tactics": {
      "DIGITAL_ARREST": "டிஜிட்டல் கைது கூற்று",
      "SAFE_ACCOUNT": "பாதுகாப்பான கணக்கிற்கு பணம்",
      "SECRECY_PAYMENT": "ரகசியமும் பணமும்",
      "CREDENTIAL_REQUEST": "OTP, PIN அல்லது கடவுச்சொல் கோரிக்கை",
      "THREAT": "கைது அல்லது சட்ட மிரட்டல்",
      "URGENCY": "அவசர அழுத்தம்",
      "PAYMENT": "பணம் கோரல்",
      "AUTHORITY": "அதிகாரக் கூற்று",
      "PRIZE_FEE": "பரிசுக்கான கட்டணம்",
      "OTHER_WARNING": "வேறு சந்தேக உத்தி",
      "ISOLATION": "தனிமைப்படுத்துதல் அல்லது ரகசியம்",
      "SUSPICIOUS_LINK": "சந்தேகமான இணைப்பு"
    },
    "errors": {
      "SPEECH_UNAVAILABLE": "உச்சரிப்பு கிடைக்கவில்லை. எழுதவும்.",
      "SPEECH_FAILED": "உச்சரிப்பு நின்றது. மைக்ரோஃபோன் அனுமதி சரிபார்.",
      "RATE_LIMITED": "ஒரு நிமிடம் கழித்து முயற்சி செய்.",
      "REGISTRY_CONFIG": "பதிவக ரகசியத்தை அமைக்கவும்.",
      "GUARD_CONFIG": "நேர்மறை தொகை வரம்பை அமைக்கவும்.",
      "CONFLICT": "இடைநிறுத்தம் முடிவடையவில்லை அல்லது தேர்வு பதிவானது.",
      "INVALID_INPUT": "சரியான UPI மற்றும் தொகையை உள்ளிடவும்.",
      "AUTH_UNAVAILABLE": "கணக்கு சரிபார்ப்பு கிடைக்கவில்லை.",
      "DATABASE_UNAVAILABLE": "தரவுத்தள பதிவு கிடைக்கவில்லை."
    }
  }
};


export const analyzerMessages:Record<Locale,{language:string;gauge:string;phrases:string;explanation:string;recommendation:string;noSignals:string;summary:Record<"LOW"|"MEDIUM"|"HIGH",string>;actions:Record<"LOW"|"MEDIUM"|"HIGH",string>}>= {
 en:{language:"Analysis language",gauge:"Scam risk score",phrases:"Highlighted warning phrases",explanation:"Why this result",recommendation:"Recommended action",noSignals:"No configured warning phrase matched. This does not prove legitimacy.",summary:{LOW:"Few configured warning signals matched. This result cannot verify the caller's identity.",MEDIUM:"Some pressure or payment signals matched. Check independently before acting.",HIGH:"Strong scam patterns or several combined pressure signals matched. Treat the request as high risk."},actions:{LOW:"Verify the caller through an independently found official number; keep OTPs and passwords private.",MEDIUM:"Pause. Contact the institution through its official app or published number before sharing information or paying.",HIGH:"Stop the call and do not pay or share credentials. Contact your bank immediately if money was sent; use 1930 or cybercrime.gov.in to report suspected fraud."}},
 hi:{language:"विश्लेषण की भाषा",gauge:"धोखाधड़ी जोखिम स्कोर",phrases:"चेतावनी वाले वाक्यांश",explanation:"इस परिणाम का कारण",recommendation:"सुझाया गया कदम",noSignals:"नियमों वाला कोई चेतावनी वाक्यांश नहीं मिला। यह प्रामाणिकता का प्रमाण नहीं है।",summary:{LOW:"कम चेतावनी संकेत मिले। यह परिणाम कॉल करने वाले की पहचान सत्यापित नहीं करता।",MEDIUM:"दबाव या भुगतान के कुछ संकेत मिले। कार्रवाई से पहले स्वतंत्र रूप से जाँचें।",HIGH:"धोखाधड़ी के मजबूत संकेत या कई दबाव वाले संकेत मिले। अनुरोध को उच्च जोखिम मानें।"},actions:{LOW:"स्वतंत्र रूप से खोजे आधिकारिक नंबर से कॉल करने वाले की जाँच करें। ओटीपी और पासवर्ड निजी रखें।",MEDIUM:"रुकें। जानकारी या पैसे देने से पहले आधिकारिक ऐप या प्रकाशित नंबर से संस्था से संपर्क करें।",HIGH:"कॉल रोकें। भुगतान या गुप्त जानकारी न दें। पैसे भेजे हों तो बैंक को तुरंत बताएँ; संदिग्ध धोखाधड़ी की शिकायत 1930 या cybercrime.gov.in पर करें।"}},
 ta:{language:"பகுப்பாய்வு மொழி",gauge:"மோசடி அபாய மதிப்பெண்",phrases:"எச்சரிக்கை சொற்றொடர்கள்",explanation:"இந்த முடிவுக்கான காரணம்",recommendation:"பரிந்துரைக்கப்படும் செயல்",noSignals:"விதிகளில் உள்ள எச்சரிக்கை சொற்றொடர் காணப்படவில்லை. இது நம்பகத்தன்மைக்கான சான்றல்ல.",summary:{LOW:"சில எச்சரிக்கைகள் மட்டுமே காணப்பட்டன. இது அழைப்பவரின் அடையாளத்தை உறுதிப்படுத்தாது.",MEDIUM:"அழுத்தம் அல்லது பணம் கேட்கும் அறிகுறிகள் உள்ளன. செயல்படும் முன் தனியாகச் சரிபார்க்கவும்.",HIGH:"வலுவான மோசடி அல்லது பல அழுத்த அறிகுறிகள் காணப்பட்டன. கோரிக்கையை அதிக அபாயமாகக் கருதவும்."},actions:{LOW:"தனியாகக் கண்டறிந்த அதிகாரப்பூர்வ எண்ணில் அழைப்பவரைச் சரிபார்க்கவும். OTP மற்றும் கடவுச்சொற்களைப் பகிர வேண்டாம்.",MEDIUM:"நிறுத்தி யோசிக்கவும். தகவல் அல்லது பணம் கொடுக்கும் முன் அதிகாரப்பூர்வ செயலி அல்லது வெளியிடப்பட்ட எண்ணில் நிறுவனத்தைத் தொடர்புகொள்ளவும்.",HIGH:"அழைப்பை நிறுத்தவும். பணம் அல்லது ரகசியத் தகவல்களைத் தர வேண்டாம். பணம் அனுப்பியிருந்தால் உடனே வங்கியைத் தொடர்புகொள்ளவும்; 1930 அல்லது cybercrime.gov.in மூலம் சந்தேக மோசடியைப் புகாரளிக்கவும்."}}
};

export const analyzerLanguageNames:Record<Locale,string>={en:"English",hi:"हिन्दी",ta:"தமிழ்"};

type RegistryCopy={title:string;value:string;type:string;lookup:string;report:string;category:string;warning:string;acknowledge:string;login:string;recent:string;mine:string;retry:string;pending:string;anchored:string;count:string;distinct:string;eligible:string;chain:string;unavailable:string;mismatch:string;minimumAge:string;privacy:string;empty:string;busy:string;success:string;error:string;explorer:string;local:string;types:Record<"phone"|"upi"|"wallet",string>;categories:Record<"impersonation"|"payment_demand"|"credential_theft"|"suspicious_contact"|"other",string>;risks:Record<"unreported"|"reported"|"high",string>;errors:Record<string,string>};
export const registryMessages:Record<Locale,RegistryCopy>={
 en:{title:"Scam report registry",value:"Phone, UPI ID or wallet address",type:"Identifier type",lookup:"Look up reports",report:"Submit report",category:"Report category",warning:"Reports are unverified allegations, not proof of fraud. Incorrect or malicious accusations can harm others and create defamation risk. Report only contact you personally experienced; verify independently before acting.",acknowledge:"I understand and believe this report is accurate.",login:"Log in to report",recent:"Recent confirmed anchors",mine:"My reports",retry:"Retry or reconcile anchor",pending:"Pending chain confirmation",anchored:"Anchored",count:"Reports",distinct:"Distinct reporters",eligible:"Reporters meeting the account-age requirement",chain:"Confirmed DB reports / application chain count",unavailable:"Chain status unavailable",mismatch:"Counts differ; confirmation or reconciliation is still needed.",minimumAge:"Minimum account age in seconds",privacy:"Only a peppered hash, identifier type and category are saved. Raw identifiers are never stored in the database or on chain.",empty:"No reports to show.",busy:"Working…",success:"Report saved and anchored.",error:"Request failed. Try again later.",explorer:"View transaction",local:"Local chain transaction (no public explorer)",types:{phone:"Indian phone",upi:"UPI ID",wallet:"Wallet address"},categories:{impersonation:"Authority impersonation",payment_demand:"Suspicious payment demand",credential_theft:"Credential theft",suspicious_contact:"Suspicious contact",other:"Other suspected scam"},risks:{unreported:"NO REPORTS FOUND",reported:"REPORTED — UNVERIFIED ALLEGATION",high:"HIGH REPORT SIGNAL — UNVERIFIED ALLEGATIONS"},errors:{DUPLICATE_REPORT:"You already reported this identifier. Use My reports to retry its anchor.",UNAUTHENTICATED:"Log in before reporting.",INVALID_INPUT:"Check the form and acknowledgment.",INVALID_IDENTIFIER:"Enter a valid Indian phone, UPI ID or wallet address.",RATE_LIMITED:"Too many requests. Wait a minute and try again.",ANCHOR_PENDING:"Saved; chain confirmation is pending. Reconcile from My reports.",ANCHOR_BUSY_OR_MISSING:"Anchor is busy or the report is unavailable. Try again later.",ANCHOR_NETWORK_CHANGED:"This report belongs to a different registry deployment."}},
 hi:{title:"संदिग्ध संपर्क रिपोर्ट रजिस्ट्री",value:"फ़ोन, यूपीआई आईडी या वॉलेट पता",type:"पहचान का प्रकार",lookup:"रिपोर्ट खोजें",report:"रिपोर्ट जमा करें",category:"रिपोर्ट की श्रेणी",warning:"रिपोर्ट अपुष्ट आरोप हैं, धोखाधड़ी का प्रमाण नहीं। गलत या दुर्भावनापूर्ण आरोप नुकसान और मानहानि का जोखिम पैदा कर सकते हैं। केवल अपने अनुभव वाले संपर्क की रिपोर्ट करें और स्वतंत्र जाँच करें।",acknowledge:"मैं समझता हूँ और मानता हूँ कि यह रिपोर्ट सही है।",login:"रिपोर्ट करने के लिए लॉग इन करें",recent:"हाल के पुष्ट एंकर",mine:"मेरी रिपोर्ट",retry:"एंकर दोबारा जाँचें या भेजें",pending:"चेन की पुष्टि लंबित है",anchored:"एंकर किया गया",count:"रिपोर्ट",distinct:"अलग रिपोर्टकर्ता",eligible:"खाते की उम्र की शर्त पूरी करने वाले रिपोर्टकर्ता",chain:"पुष्ट डेटाबेस रिपोर्ट / ऐप चेन गणना",unavailable:"चेन की स्थिति उपलब्ध नहीं",mismatch:"गणना अलग है; पुष्टि या मिलान अभी आवश्यक है।",minimumAge:"खाते की न्यूनतम उम्र सेकंड में",privacy:"केवल गुप्त पेपर वाला हैश, पहचान का प्रकार और श्रेणी सेव होते हैं। असली पहचान डेटाबेस या चेन पर नहीं रखी जाती।",empty:"दिखाने के लिए कोई रिपोर्ट नहीं।",busy:"काम जारी है…",success:"रिपोर्ट सेव और एंकर हो गई।",error:"अनुरोध विफल हुआ। बाद में कोशिश करें।",explorer:"लेनदेन देखें",local:"स्थानीय चेन लेनदेन; सार्वजनिक एक्सप्लोरर नहीं",types:{phone:"भारतीय फ़ोन",upi:"यूपीआई आईडी",wallet:"वॉलेट पता"},categories:{impersonation:"अधिकारी बनकर संपर्क",payment_demand:"संदिग्ध भुगतान की माँग",credential_theft:"गुप्त जानकारी की चोरी",suspicious_contact:"संदिग्ध संपर्क",other:"अन्य संदिग्ध धोखाधड़ी"},risks:{unreported:"कोई रिपोर्ट नहीं मिली",reported:"रिपोर्ट किया गया — अपुष्ट आरोप",high:"रिपोर्ट का उच्च संकेत — अपुष्ट आरोप"},errors:{DUPLICATE_REPORT:"आपने यह पहचान पहले रिपोर्ट की है। मेरी रिपोर्ट से एंकर दोबारा जाँचें।",UNAUTHENTICATED:"रिपोर्ट से पहले लॉग इन करें।",INVALID_INPUT:"फ़ॉर्म और सहमति जाँचें।",INVALID_IDENTIFIER:"सही भारतीय फ़ोन, यूपीआई आईडी या वॉलेट पता दें।",RATE_LIMITED:"बहुत अधिक अनुरोध। एक मिनट बाद कोशिश करें।",ANCHOR_PENDING:"सेव है; चेन की पुष्टि लंबित है। मेरी रिपोर्ट से दोबारा जाँचें।"}},
 ta:{title:"சந்தேகத் தொடர்பு புகார் பதிவகம்",value:"தொலைபேசி, UPI அடையாளம் அல்லது வாலட் முகவரி",type:"அடையாள வகை",lookup:"புகார்களைத் தேடு",report:"புகார் சமர்ப்பி",category:"புகார் வகை",warning:"புகார்கள் உறுதிப்படுத்தப்படாத குற்றச்சாட்டுகள்; மோசடிக்கான சான்றல்ல. தவறான அல்லது தீய நோக்கமுள்ள புகார்கள் பிறரைப் பாதித்து அவதூறு அபாயத்தை ஏற்படுத்தும். நீங்கள் நேரடியாக அனுபவித்த தொடர்பை மட்டும் புகாரளித்து தனியாகச் சரிபார்க்கவும்.",acknowledge:"இதைப் புரிந்துகொண்டு புகார் சரியானது என நம்புகிறேன்.",login:"புகாரளிக்க உள்நுழையவும்",recent:"சமீபத்திய உறுதியான பதிவுகள்",mine:"எனது புகார்கள்",retry:"பதிவை மீண்டும் முயற்சி அல்லது சரிபார்",pending:"சங்கிலி உறுதிப்படுத்தல் நிலுவையில் உள்ளது",anchored:"சங்கிலியில் பதியப்பட்டது",count:"புகார்கள்",distinct:"தனித்தனி புகாரளிப்போர்",eligible:"கணக்கின் வயது நிபந்தனையை நிறைவேற்றியவர்கள்",chain:"உறுதியான தரவுத்தள புகார்கள் / செயலி சங்கிலி எண்ணிக்கை",unavailable:"சங்கிலி நிலை கிடைக்கவில்லை",mismatch:"எண்ணிக்கைகள் வேறுபடுகின்றன; உறுதிப்படுத்தல் அல்லது சரிபார்ப்பு தேவை.",minimumAge:"குறைந்தபட்ச கணக்கு வயது வினாடிகளில்",privacy:"ரகசிய மதிப்புடன் சேர்த்த ஹாஷ், அடையாள வகை மற்றும் வகைப்பாடு மட்டுமே சேமிக்கப்படும். மூல அடையாளங்கள் தரவுத்தளத்திலோ சங்கிலியிலோ சேமிக்கப்படாது.",empty:"காட்ட புகார்கள் இல்லை.",busy:"செயல்படுகிறது…",success:"புகார் சேமித்து சங்கிலியில் பதியப்பட்டது.",error:"கோரிக்கை தோல்வி. பின்னர் முயற்சிக்கவும்.",explorer:"பரிவர்த்தனையைப் பார்",local:"உள்ளூர் சங்கிலி பரிவர்த்தனை; பொது எக்ஸ்ப்ளோரர் இல்லை",types:{phone:"இந்திய தொலைபேசி",upi:"UPI அடையாளம்",wallet:"வாலட் முகவரி"},categories:{impersonation:"அதிகாரி ஆள்மாறாட்டம்",payment_demand:"சந்தேகமான பணக் கோரிக்கை",credential_theft:"ரகசியத் தகவல் திருட்டு",suspicious_contact:"சந்தேகத் தொடர்பு",other:"பிற சந்தேக மோசடி"},risks:{unreported:"புகார்கள் இல்லை",reported:"புகார் உள்ளது — உறுதியற்ற குற்றச்சாட்டு",high:"அதிக புகார் அறிகுறி — உறுதியற்ற குற்றச்சாட்டுகள்"},errors:{DUPLICATE_REPORT:"இந்த அடையாளத்தை ஏற்கனவே புகாரளித்தீர்கள். எனது புகார்களில் சரிபார்க்கவும்.",UNAUTHENTICATED:"முதலில் உள்நுழையவும்.",INVALID_INPUT:"படிவத்தையும் ஒப்புதலையும் சரிபார்க்கவும்.",INVALID_IDENTIFIER:"சரியான இந்திய தொலைபேசி, UPI அல்லது வாலட் முகவரியை உள்ளிடவும்.",RATE_LIMITED:"அதிக கோரிக்கைகள். ஒரு நிமிடம் காத்திருக்கவும்.",ANCHOR_PENDING:"சேமிக்கப்பட்டது; சங்கிலி உறுதி நிலுவையில் உள்ளது. எனது புகார்களில் சரிபார்க்கவும்."}}
};

export const pressureMessages:Record<Locale,{primary:string;intro:string;steps:readonly string[];next:string;back:string;skip:string;finish:string;official:string;reset:string;report:string;scope:string;unknown:string;guardian:string;guardianFailure:string;guardianSent:string;guardianNone:string;local:string;actions:Record<"HANG_UP"|"DO_NOT_PAY"|"VERIFIED_SAFE",string>;reasons:Record<"strongSignals"|"reported"|"unverified"|"notAuthorized"|"authorized"|"unknown"|"uncertainSignals",string>}>= {
 en:{primary:"Someone is pressuring me",intro:"Pause before paying or sharing private information. Check the contact, examine their words, then verify any official claim.",steps:["1. Look up the number or UPI","2. Paste what they said","3. Check an official claim"],next:"Next step",back:"Back",skip:"Lookup unavailable — continue cautiously",finish:"Show my next action",official:"They claim to be an official",reset:"Start again",report:"Report this",scope:"Verification covers only the displayed registered purpose, amount and payee at the time checked. It is not blanket permission to pay or proof the contact channel belongs to the officer. Stop if the request changes. This card expires within two minutes or at the registered action expiry, whichever comes first.",unknown:"No report or LOW analyzer risk proves a caller legitimate.",guardian:"Notify my configured Guardians on HIGH risk (score and tactics only)",guardianFailure:"Guardian delivery failed or is unavailable. Contact your family directly.",guardianSent:"Guardian alert accepted for delivery.",guardianNone:"No Guardian contact is configured; add one in Guardian settings.",local:"The transcript stays in this browser. Only risk metadata leaves it for an enabled Guardian alert.",actions:{HANG_UP:"HANG UP",DO_NOT_PAY:"DO NOT PAY",VERIFIED_SAFE:"VERIFIED, SAFE TO PROCEED"},reasons:{uncertainSignals:"Warning signals remain. Do not pay; confirm independently.",strongSignals:"Strong pressure/scam indicators are present. Stop the contact and do not pay.",reported:"This contact has unverified reports. Do not pay; check through an independently found official channel.",unverified:"The caller's request has not been verified. Do not pay or share secrets.",notAuthorized:"The officer's identity is verified, but this request is not authorized. Do not pay.",authorized:"Identity and this specific registered action are authorized. Use the independently verified official channel for this action only.",unknown:"A check is incomplete or unavailable. Do not pay while you verify independently."}},
 hi:{primary:"कोई मुझ पर दबाव डाल रहा है",intro:"भुगतान या निजी जानकारी देने से पहले रुकें। संपर्क जाँचें, उनकी बातें जाँचें और अधिकारी होने का दावा सत्यापित करें।",steps:["1. नंबर या यूपीआई खोजें","2. उनकी बातें पेस्ट करें","3. अधिकारी का दावा जाँचें"],next:"अगला चरण",back:"पीछे",skip:"खोज उपलब्ध नहीं — सावधानी से आगे बढ़ें",finish:"अगला कदम दिखाएँ",official:"वे अधिकारी होने का दावा करते हैं",reset:"फिर से शुरू करें",report:"इसकी रिपोर्ट करें",scope:"सत्यापन केवल दिखाए गए पंजीकृत उद्देश्य, रकम और प्राप्तकर्ता के लिए उस समय लागू है। यह हर भुगतान की अनुमति या संपर्क माध्यम की पहचान का प्रमाण नहीं है। अनुरोध बदले तो रुकें। कार्ड अधिकतम दो मिनट या पंजीकृत कार्रवाई की अवधि समाप्त होने पर, जो पहले आए, समाप्त होता है।",unknown:"कोई रिपोर्ट न होना या कम जोखिम कॉलर की प्रामाणिकता का प्रमाण नहीं है।",guardian:"उच्च जोखिम पर मेरे गार्जियन को बताएँ; केवल स्कोर और संकेत",guardianFailure:"गार्जियन सूचना विफल या उपलब्ध नहीं है। परिवार से सीधे संपर्क करें।",guardianSent:"गार्जियन सूचना भेजने के लिए स्वीकार हुई।",guardianNone:"गार्जियन संपर्क नहीं है। सेटिंग में जोड़ें।",local:"बातचीत इसी ब्राउज़र में रहती है। सक्षम अलर्ट के लिए केवल जोखिम का विवरण भेजा जाता है।",actions:{HANG_UP:"कॉल काट दें",DO_NOT_PAY:"भुगतान न करें",VERIFIED_SAFE:"सत्यापित, आगे बढ़ना सुरक्षित है"},reasons:{uncertainSignals:"चेतावनी संकेत हैं। भुगतान न करें; स्वतंत्र जाँच करें।",strongSignals:"दबाव या धोखाधड़ी के मजबूत संकेत हैं। संपर्क रोकें और भुगतान न करें।",reported:"इस संपर्क पर अपुष्ट रिपोर्ट हैं। भुगतान न करें; आधिकारिक माध्यम से स्वतंत्र जाँच करें।",unverified:"कॉलर का अनुरोध सत्यापित नहीं है। भुगतान या गुप्त जानकारी न दें।",notAuthorized:"अधिकारी की पहचान सही है, पर अनुरोध की अनुमति नहीं। भुगतान न करें।",authorized:"पहचान और यह खास पंजीकृत कार्रवाई अधिकृत हैं। केवल इसी कार्रवाई के लिए स्वतंत्र रूप से जाँचा आधिकारिक माध्यम इस्तेमाल करें।",unknown:"जाँच अधूरी या उपलब्ध नहीं है। स्वतंत्र जाँच तक भुगतान न करें।"}},
 ta:{primary:"யாரோ எனக்கு அழுத்தம் கொடுக்கிறார்கள்",intro:"பணம் அல்லது தனிப்பட்ட தகவல் கொடுக்கும் முன் நிறுத்தவும். தொடர்பையும் அவர்களின் வார்த்தைகளையும் சரிபார்த்து அதிகாரி என்ற கோரிக்கையைச் சோதிக்கவும்.",steps:["1. எண் அல்லது UPI தேடு","2. அவர்கள் சொன்னதை ஒட்டு","3. அதிகாரி கோரிக்கையைச் சரிபார்"],next:"அடுத்த படி",back:"பின்னால்",skip:"தேடல் கிடைக்கவில்லை — கவனமாகத் தொடரவும்",finish:"அடுத்த செயலைக் காட்டு",official:"தங்களை அதிகாரி எனக் கூறுகிறார்கள்",reset:"மீண்டும் தொடங்கு",report:"இதைப் புகாரளி",scope:"சோதித்த நேரத்தில் காட்டப்பட்ட பதிவு செய்யப்பட்ட நோக்கம், தொகை மற்றும் பெறுநருக்கு மட்டுமே சரிபார்ப்பு பொருந்தும். இது அனைத்து பணப் பரிவர்த்தனைக்கும் அனுமதியோ தொடர்பு வழியின் உரிமைக்கான சான்றோ அல்ல. கோரிக்கை மாறினால் நிறுத்தவும். அட்டை அதிகபட்சம் இரண்டு நிமிடம் அல்லது பதிவு செய்யப்பட்ட செயல் காலாவதியாகும்போது முடியும்.",unknown:"புகார் இல்லாததோ குறைந்த அபாயமோ அழைப்பவரின் நம்பகத்தன்மையை நிரூபிக்காது.",guardian:"அதிக அபாயத்தில் என் பாதுகாவலருக்கு மதிப்பெண் மற்றும் அறிகுறிகளை மட்டும் அனுப்பு",guardianFailure:"பாதுகாவலர் அறிவிப்பு தோல்வி அல்லது கிடைக்கவில்லை. குடும்பத்தை நேரடியாகத் தொடர்புகொள்ளவும்.",guardianSent:"பாதுகாவலர் அறிவிப்பு அனுப்ப ஏற்றுக்கொள்ளப்பட்டது.",guardianNone:"பாதுகாவலர் தொடர்பு இல்லை. அமைப்புகளில் சேர்க்கவும்.",local:"உரையாடல் இந்த உலாவியிலேயே இருக்கும். இயக்கப்பட்ட அறிவிப்புக்கு அபாய விவரங்கள் மட்டும் அனுப்பப்படும்.",actions:{HANG_UP:"அழைப்பை நிறுத்தவும்",DO_NOT_PAY:"பணம் செலுத்த வேண்டாம்",VERIFIED_SAFE:"சரிபார்க்கப்பட்டது, தொடர்வது பாதுகாப்பானது"},reasons:{uncertainSignals:"எச்சரிக்கை அறிகுறிகள் உள்ளன. பணம் செலுத்தாமல் தனியாகச் சரிபார்க்கவும்.",strongSignals:"வலுவான அழுத்தம் அல்லது மோசடி அறிகுறிகள் உள்ளன. தொடர்பை நிறுத்தி பணம் செலுத்த வேண்டாம்.",reported:"இந்த தொடர்புக்கு உறுதியற்ற புகார்கள் உள்ளன. பணம் செலுத்தாமல் அதிகாரப்பூர்வ வழியில் தனியாகச் சரிபார்க்கவும்.",unverified:"அழைப்பவரின் கோரிக்கை சரிபார்க்கப்படவில்லை. பணம் அல்லது ரகசியத் தகவல் கொடுக்க வேண்டாம்.",notAuthorized:"அதிகாரியின் அடையாளம் சரியானது; இந்த கோரிக்கைக்கு அனுமதி இல்லை. பணம் செலுத்த வேண்டாம்.",authorized:"அடையாளமும் இந்த குறிப்பிட்ட பதிவு செய்யப்பட்ட செயலும் அங்கீகரிக்கப்பட்டன. தனியாகச் சரிபார்த்த அதிகாரப்பூர்வ வழியில் இந்த செயலுக்காக மட்டும் தொடரவும்.",unknown:"சோதனை முழுமையில்லை அல்லது கிடைக்கவில்லை. தனியாகச் சரிபார்க்கும் வரை பணம் செலுத்த வேண்டாம்."}}
};
export const guardianMessages:Record<Locale,{title:string;intro:string;name:string;channel:string;target:string;secret:string;consent:string;save:string;remove:string;simulate:string;simulation:string;contacts:string;history:string;none:string;busy:string;error:string;sent:string;failed:string;pending:string;noContacts:string;limit:string;channels:Record<"webhook"|"telegram",string>;sources:Record<"upi_demo"|"browser"|"server"|"simulation",string>}>= {
 en:{title:"Family Guardian",intro:"Add up to three consenting family contacts. Alerts contain only riskScore, tactic codes, a fixed safety summary and time. They contain no transcript, number, UPI ID or wallet. Telegram needs the server's bot configuration and the recipient must start that bot first.",name:"Contact label",channel:"Delivery channel",target:"Public HTTPS webhook URL or Telegram chat ID",secret:"Optional webhook bearer secret (16+ characters)",consent:"This contact agrees to receive my risk alerts. Saving enables notifications.",save:"Add contact",remove:"Remove contact",simulate:"Simulate alert",simulation:"Simulation sends a clearly marked test to every configured contact.",contacts:"My contacts",history:"Alert delivery log",none:"No contacts or alerts yet.",busy:"Working…",error:"Request failed. Check configuration and try again.",sent:"Accepted for delivery",failed:"Delivery failed — contact family directly",pending:"Pending or unconfirmed delivery",noContacts:"Add a contact before simulating an alert.",limit:"Maximum three contacts; remove one before adding another.",channels:{webhook:"Webhook / n8n",telegram:"Telegram"},sources:{upi_demo:"UPI demo",browser:"Browser risk metadata",server:"Server analyzer",simulation:"SIMULATION"}},
 hi:{title:"परिवार गार्जियन",intro:"सहमति वाले अधिकतम तीन संपर्क जोड़ें। अलर्ट में केवल जोखिम स्कोर, संकेत कोड, तय सुरक्षा संदेश और समय होते हैं; बातचीत, नंबर, यूपीआई या वॉलेट नहीं। टेलीग्राम के लिए सर्वर का बॉट सेटअप और संपर्क द्वारा बॉट शुरू करना आवश्यक है।",name:"संपर्क का नाम",channel:"सूचना का माध्यम",target:"सार्वजनिक HTTPS वेबहुक या टेलीग्राम चैट आईडी",secret:"वैकल्पिक वेबहुक गोपनीय टोकन; कम से कम 16 अक्षर",consent:"संपर्क मेरी जोखिम सूचनाओं के लिए सहमत है। सेव करने से सूचनाएँ चालू होती हैं।",save:"संपर्क जोड़ें",remove:"संपर्क हटाएँ",simulate:"अलर्ट का परीक्षण",simulation:"परीक्षण का स्पष्ट संदेश सभी सेट किए संपर्कों को जाता है।",contacts:"मेरे संपर्क",history:"अलर्ट भेजने का रिकॉर्ड",none:"अभी कोई संपर्क या अलर्ट नहीं।",busy:"काम जारी है…",error:"अनुरोध विफल। सेटअप जाँचकर फिर कोशिश करें।",sent:"भेजने के लिए स्वीकार हुआ",failed:"भेजना विफल — परिवार से सीधे संपर्क करें",pending:"भेजना लंबित या अपुष्ट",noContacts:"परीक्षण से पहले संपर्क जोड़ें।",limit:"अधिकतम तीन संपर्क; पहले एक हटाएँ।",channels:{webhook:"वेबहुक / n8n",telegram:"टेलीग्राम"},sources:{upi_demo:"यूपीआई डेमो",browser:"ब्राउज़र जोखिम विवरण",server:"सर्वर विश्लेषण",simulation:"परीक्षण"}},
 ta:{title:"குடும்ப பாதுகாவலர்",intro:"ஒப்புதல் அளித்த மூன்று குடும்ப தொடர்புகள் வரை சேர்க்கவும். அறிவிப்பில் அபாய மதிப்பெண், அறிகுறி குறியீடுகள், நிலையான பாதுகாப்பு செய்தி மற்றும் நேரம் மட்டும்; உரையாடல், எண், UPI அல்லது வாலட் இல்லை. டெலிகிராமுக்கு சர்வர் பாட் அமைப்பும் பெறுநர் அந்த பாட்டை முதலில் தொடங்குவதும் தேவை.",name:"தொடர்பின் பெயர்",channel:"அறிவிப்பு வழி",target:"பொது HTTPS வெப்ஹுக் அல்லது டெலிகிராம் சாட் ID",secret:"விருப்ப வெப்ஹுக் ரகசியம்; குறைந்தது 16 எழுத்துகள்",consent:"இந்த தொடர்பு என் அபாய அறிவிப்புகளைப் பெற ஒப்புக்கொள்கிறார். சேமிப்பது அறிவிப்புகளை இயக்கும்.",save:"தொடர்பு சேர்",remove:"தொடர்பு நீக்கு",simulate:"அறிவிப்பைச் சோதிக்கவும்",simulation:"சோதனை என்று குறிக்கப்பட்ட செய்தி அமைத்த அனைத்து தொடர்புகளுக்கும் அனுப்பப்படும்.",contacts:"எனது தொடர்புகள்",history:"அறிவிப்பு பதிவேடு",none:"தொடர்புகள் அல்லது அறிவிப்புகள் இல்லை.",busy:"செயல்படுகிறது…",error:"கோரிக்கை தோல்வி. அமைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.",sent:"அனுப்ப ஏற்றுக்கொள்ளப்பட்டது",failed:"அனுப்ப முடியவில்லை — குடும்பத்தை நேரடியாகத் தொடர்புகொள்ளவும்",pending:"அனுப்புவது நிலுவையில் அல்லது உறுதியில்லை",noContacts:"சோதனைக்கு முன் தொடர்பு சேர்க்கவும்.",limit:"அதிகபட்சம் மூன்று தொடர்புகள்; முதலில் ஒன்றை நீக்கவும்.",channels:{webhook:"வெப்ஹுக் / n8n",telegram:"டெலிகிராம்"},sources:{upi_demo:"UPI டெமோ",browser:"உலாவி அபாய விவரம்",server:"சர்வர் பகுப்பாய்வு",simulation:"சோதனை"}}
};

export const guardianSummaryMessages:Record<Locale,string>={en:"High-risk scam indicators detected. Check in with your family member using a trusted number. No transcript or identifier is shared.",hi:"धोखाधड़ी के उच्च जोखिम संकेत मिले। भरोसेमंद नंबर से अपने परिवार के सदस्य से संपर्क करें। कोई बातचीत या पहचान साझा नहीं होती।",ta:"அதிக மோசடி அபாய அறிகுறிகள் உள்ளன. நம்பகமான எண்ணில் குடும்ப உறுப்பினரைத் தொடர்புகொள்ளவும். உரையாடல் அல்லது அடையாளம் பகிரப்படவில்லை."};

export const dashboardMessages = {
 en:{title:"Impact dashboard",personal:"Your activity",global:"Global activity (administrator)",refresh:"Refresh metrics",empty:"No completed activity yet",verifications:"Verification attempts by result",median:"Median verification processing time",timeNote:"Completed verification_events.duration_ms; server processing time, not the time a person spends responding. Pending attempts are excluded.",analyses:"Saved analyses by verdict",reports:"Reports by identifier type",anchored:"Distinct confirmed transaction hashes",anchorNote:"Reports, evidence manifests and institution updates recorded in this database. Pending transactions are excluded; this is not a scan of every chain transaction.",estimate:"Estimated losses prevented — scenario assumption",assumption:"Assumed loss per HIGH-risk analysis (₹)",probability:"Assumed percentage actually prevented",estimateNote:"HIGH analysis count × assumed loss × assumed prevention percentage. HIGH analyses may be repeat/cache records, not unique victims. No observed financial loss or prevented payment is measured. Browser-only analyses are not saved or counted.",formula:"HIGH analyses used",unknown:"Other / legacy result",noDuration:"No completed timing data",generated:"Computed at",units:"ms"},
 hi:{title:"प्रभाव डैशबोर्ड",personal:"आपकी गतिविधि",global:"सभी गतिविधियाँ (प्रशासक)",refresh:"आँकड़े ताज़ा करें",empty:"अभी कोई पूरी गतिविधि नहीं",verifications:"परिणाम के अनुसार पहचान-जाँच प्रयास",median:"पहचान-जाँच प्रसंस्करण समय का मध्यक",timeNote:"पूरे verification_events.duration_ms का सर्वर प्रसंस्करण समय; व्यक्ति के जवाब देने का समय नहीं। अधूरे प्रयास शामिल नहीं हैं।",analyses:"परिणाम के अनुसार सहेजे गए विश्लेषण",reports:"पहचान प्रकार के अनुसार रिपोर्ट",anchored:"अलग-अलग पुष्ट लेन-देन हैश",anchorNote:"डेटाबेस में दर्ज रिपोर्ट, साक्ष्य और संस्था अपडेट। लंबित लेन-देन शामिल नहीं हैं; यह पूरी चेन का आँकड़ा नहीं है।",estimate:"अनुमानित रोका गया नुकसान — परिदृश्य की धारणा",assumption:"हर उच्च जोखिम विश्लेषण पर माना गया नुकसान (₹)",probability:"वास्तव में रोके जाने का माना गया प्रतिशत",estimateNote:"उच्च जोखिम विश्लेषण संख्या × माना गया नुकसान × रोके जाने का प्रतिशत। रिकॉर्ड दोहराए गए हो सकते हैं, अलग पीड़ित नहीं। वास्तविक बचत या रोके गए भुगतान का मापन नहीं है। केवल ब्राउज़र के विश्लेषण सहेजे या गिने नहीं जाते।",formula:"गिने गए उच्च जोखिम विश्लेषण",unknown:"अन्य / पुराना परिणाम",noDuration:"पूरी समय जानकारी नहीं",generated:"गणना का समय",units:"मि.से."},
 ta:{title:"தாக்க அளவுகள்",personal:"உங்கள் செயல்பாடு",global:"அனைவரின் செயல்பாடு (நிர்வாகி)",refresh:"அளவுகளைப் புதுப்பி",empty:"இன்னும் முடிந்த செயல்பாடு இல்லை",verifications:"முடிவு வாரியாகச் சரிபார்ப்பு முயற்சிகள்",median:"சரிபார்ப்பு செயலாக்க நேரத்தின் இடைநிலை",timeNote:"முடிந்த verification_events.duration_ms சேவையக நேரம்; மனிதர் பதிலளிக்கும் நேரம் அல்ல. நிலுவை முயற்சிகள் சேர்க்கப்படவில்லை.",analyses:"முடிவு வாரியாகச் சேமித்த பகுப்பாய்வுகள்",reports:"அடையாள வகை வாரியாகப் புகார்கள்",anchored:"தனித்தனி உறுதியான பரிவர்த்தனை ஹாஷ்கள்",anchorNote:"இந்தத் தரவுத்தளத்தில் பதிந்த புகார், சான்று, நிறுவன மாற்றங்கள். நிலுவைப் பரிவர்த்தனைகள் சேர்க்கப்படவில்லை; முழுச் சங்கிலி கணக்கல்ல.",estimate:"தடுக்கப்பட்ட இழப்பின் மதிப்பீடு — கற்பனை அனுமானம்",assumption:"ஒவ்வொரு அதிக அபாய பகுப்பாய்விற்கும் கருதும் இழப்பு (₹)",probability:"உண்மையில் தடுக்கப்பட்டதாகக் கருதும் சதவீதம்",estimateNote:"அதிக அபாய எண்ணிக்கை × கருதும் இழப்பு × தடுப்பு சதவீதம். பதிவுகள் மீண்டும் வந்ததாக இருக்கலாம்; தனித்தனி பாதிக்கப்பட்டவர்களல்ல. உண்மையான பண சேமிப்பு அல்லது தடுத்த கட்டணம் அளவிடப்படவில்லை. உலாவியில் மட்டும் செய்த பகுப்பாய்வுகள் சேமிக்கப்படவோ எண்ணப்படவோ இல்லை.",formula:"பயன்படுத்திய அதிக அபாய எண்ணிக்கை",unknown:"பிற / பழைய முடிவு",noDuration:"முடிந்த நேரத் தரவு இல்லை",generated:"கணக்கிட்ட நேரம்",units:"மி.வி."},
} as const;
export const demoMessages = {
 en:{title:"90-second guided demo",badge:"SYNTHETIC DEMO",intro:"Six steps, about 15 seconds each. Press Next step when ready. Rehearsal runs without accounts or services; connected mode uses the real API and only displays confirmed results.",next:"Next step",restart:"Restart scenario",elapsed:"Elapsed seconds",complete:"Scenario complete",rehearsal:"Rehearsal — simulated DB, Guardian delivery and chain",connected:"Connected demo — real API / testnet",useConnected:"Use connected demo",login:"Log in with the seeded citizen account first",setup:"Prepare browser-held demo keys",passphrase:"Demo key passphrase (12+ characters; never sent)",prepare:"Generate keys and download PUBLIC seed fixture",unlock:"Unlock officer key in this browser",keysNote:"Prepare once in this browser, seed the downloaded public fixture, then sign in as the citizen here. Issuer and officer private keys remain encrypted in this browser. Rehearsal uses temporary keys and never registers a trusted institution.",ready:"Browser keys / public fixture ready",failed:"Step could not complete. Check configuration and try again. No success is assumed.",retry:"Retry this step",noGuardian:"No Guardian contact configured; no external alert was sent.",alertPending:"Delivery was not accepted; check Guardian history.",simulation:"Simulated result — no real account or chain change",anchored:"Report confirmed on chain",pending:"Report saved; chain confirmation pending. This step is not complete yet.",guardian:"Open Guardian settings",dashboard:"Open dashboard",reportWarning:"Only the reserved synthetic number is used in this demo. It is not an allegation against a real person.",receipt:"Signed verdict receipt",steps:["Fake CBI call","Local analysis: HIGH RISK","Guardian alert","Fake caller cannot prove identity","Real demo officer: identity + action authorized","Synthetic number reported and anchored"],details:["A fake caller threatens digital arrest and demands a safe-account transfer. The fictional contact is +91 0000000000.","The browser rules find arrest threats, secrecy and a payment demand. No transcript is uploaded.","Only riskScore, known tactics, a fixed summary and time are sent. Rehearsal simulates delivery; connected mode requires a contact.","A fresh challenge receives an invalid token. The caller is NOT VERIFIED. Hang up; do not pay.","A separate low-pressure information request matches the demo institution’s current official action. The officer signs with their browser key. This does not authorize the earlier scam payment.","The citizen reports the synthetic number; the relayer anchors its peppered hash. A pending transaction is never presented as confirmed."],transcript:"SYNTHETIC: I am calling from CBI. You are under digital arrest. Transfer money to a safe account immediately. Don't tell anyone."},
 hi:{title:"90 सेकंड का निर्देशित डेमो",badge:"कृत्रिम डेमो",intro:"छह चरण, लगभग 15 सेकंड प्रति चरण। तैयार होने पर अगला चरण दबाएँ। अभ्यास बिना खाते या सेवाओं के चलता है; जुड़ा डेमो असली API का पुष्ट परिणाम दिखाता है।",next:"अगला चरण",restart:"फिर शुरू करें",elapsed:"बीते सेकंड",complete:"परिदृश्य पूरा",rehearsal:"अभ्यास — डेटाबेस, Guardian और चेन सिमुलेशन",connected:"जुड़ा डेमो — असली API / टेस्टनेट",useConnected:"जुड़ा डेमो चलाएँ",login:"पहले सीड किए नागरिक खाते से लॉग इन करें",setup:"ब्राउज़र में डेमो कुंजियाँ बनाएँ",passphrase:"डेमो कुंजी पासफ़्रेज़ (12+ अक्षर; भेजा नहीं जाता)",prepare:"कुंजियाँ बनाएँ और सार्वजनिक सीड फ़ाइल डाउनलोड करें",unlock:"इसी ब्राउज़र में अधिकारी कुंजी खोलें",keysNote:"इस ब्राउज़र में एक बार तैयार करें, सार्वजनिक फ़ाइल से सीड करें, फिर यहाँ नागरिक लॉग इन करें। निजी कुंजियाँ इसी ब्राउज़र में एन्क्रिप्टेड रहती हैं। अभ्यास अस्थायी कुंजियाँ इस्तेमाल करता है और संस्था को भरोसेमंद नहीं बनाता।",ready:"ब्राउज़र कुंजियाँ / सार्वजनिक फ़ाइल तैयार",failed:"चरण पूरा नहीं हुआ। सेटअप जाँचकर फिर प्रयास करें। सफलता नहीं मानी गई है।",retry:"यह चरण फिर करें",noGuardian:"Guardian संपर्क नहीं है; बाहरी अलर्ट नहीं भेजा गया।",alertPending:"डिलीवरी स्वीकार नहीं हुई; Guardian इतिहास देखें।",simulation:"सिमुलेशन — असली खाते या चेन में बदलाव नहीं",anchored:"रिपोर्ट चेन पर पुष्ट है",pending:"रिपोर्ट सहेजी गई; चेन पुष्टि लंबित है। यह चरण अभी पूरा नहीं है।",guardian:"Guardian सेटिंग खोलें",dashboard:"डैशबोर्ड खोलें",reportWarning:"केवल कृत्रिम नंबर इस्तेमाल होता है। यह किसी वास्तविक व्यक्ति पर आरोप नहीं है।",receipt:"हस्ताक्षरित परिणाम रसीद",steps:["नकली CBI कॉल","स्थानीय विश्लेषण: उच्च जोखिम","Guardian अलर्ट","नकली कॉलर पहचान साबित नहीं करता","डेमो अधिकारी: पहचान और अनुरोध अधिकृत","कृत्रिम नंबर की रिपोर्ट चेन पर"],details:["नकली कॉलर डिजिटल अरेस्ट की धमकी और सुरक्षित खाते में भुगतान माँगता है। काल्पनिक संपर्क +91 0000000000 है।","ब्राउज़र नियम धमकी, गोपनीयता और भुगतान माँग पकड़ते हैं। विवरण अपलोड नहीं होता।","केवल स्कोर, तय रणनीतियाँ, निश्चित सारांश और समय भेजा जाता है। अभ्यास सिमुलेशन है; जुड़े डेमो में संपर्क चाहिए।","नई चुनौती को गलत टोकन मिलता है। कॉलर सत्यापित नहीं है। कॉल बंद करें और भुगतान न करें।","अलग, बिना दबाव की सूचना माँग संस्था के चालू आधिकारिक कार्य से मिलती है। अधिकारी ब्राउज़र कुंजी से हस्ताक्षर करता है। पुरानी ठगी का भुगतान अधिकृत नहीं होता।","नागरिक कृत्रिम नंबर की रिपोर्ट करता है; रिलेर हैश को चेन पर दर्ज करता है। लंबित लेन-देन को पुष्ट नहीं बताया जाता।"],transcript:"कृत्रिम: मैं CBI से बोल रहा हूँ। आप digital arrest में हैं। तुरंत पैसे safe account में transfer करें। किसी को मत बताना।"},
 ta:{title:"90 வினாடி வழிகாட்டிய விளக்கம்",badge:"செயற்கை விளக்கம்",intro:"ஆறு படிகள், ஒவ்வொன்றும் சுமார் 15 வினாடிகள். தயாரானதும் அடுத்த படியை அழுத்தவும். பயிற்சிக்கு கணக்கு அல்லது சேவை தேவையில்லை; இணைந்த விளக்கம் உண்மையான API உறுதியான முடிவுகளை மட்டும் காட்டும்.",next:"அடுத்த படி",restart:"மீண்டும் தொடங்கு",elapsed:"கடந்த வினாடிகள்",complete:"விளக்கம் முடிந்தது",rehearsal:"பயிற்சி — தரவுத்தளம், Guardian, சங்கிலி உருவகப்படுத்தல்",connected:"இணைந்த விளக்கம் — உண்மையான API / சோதனைச் சங்கிலி",useConnected:"இணைந்த விளக்கத்தைப் பயன்படுத்து",login:"முதலில் விதைத்த குடிமகன் கணக்கில் உள்நுழையவும்",setup:"உலாவியில் விளக்கக் கீகளைத் தயார் செய்",passphrase:"கீ கடவுச்சொல் (12+ எழுத்துகள்; அனுப்பப்படாது)",prepare:"கீகளை உருவாக்கி பொது விதைக் கோப்பைப் பதிவிறக்கு",unlock:"இந்த உலாவியில் அதிகாரி கீயைத் திற",keysNote:"இந்த உலாவியில் ஒருமுறை தயார் செய்து பொது கோப்பை விதைத்து இங்கே குடிமகனாக உள்நுழையவும். தனிப்பட்ட கீகள் இந்த உலாவியில் மறையாக்கப்பட்டுள்ளன. பயிற்சி தற்காலிக கீகளைப் பயன்படுத்தும்; நம்பக நிறுவனத்தைப் பதிவு செய்யாது.",ready:"உலாவிக் கீகள் / பொது கோப்பு தயார்",failed:"படி முடியவில்லை. அமைப்பைப் பார்த்து மீண்டும் முயலவும். வெற்றி ஊகிக்கப்படவில்லை.",retry:"இந்தப் படியை மீண்டும் செய்",noGuardian:"Guardian தொடர்பு இல்லை; வெளி எச்சரிக்கை அனுப்பப்படவில்லை.",alertPending:"அனுப்புதல் ஏற்கப்படவில்லை; Guardian வரலாற்றைப் பார்க்கவும்.",simulation:"உருவக முடிவு — உண்மையான கணக்கு அல்லது சங்கிலி மாற்றமில்லை",anchored:"புகார் சங்கிலியில் உறுதியானது",pending:"புகார் சேமிக்கப்பட்டது; சங்கிலி உறுதி நிலுவை. படி இன்னும் முடியவில்லை.",guardian:"Guardian அமைப்பைத் திற",dashboard:"அளவுகள் பக்கத்தைத் திற",reportWarning:"செயற்கை எண் மட்டுமே பயன்படும். உண்மையான நபர் மீதான குற்றச்சாட்டல்ல.",receipt:"கையொப்பமிட்ட முடிவு ரசீது",steps:["போலி CBI அழைப்பு","உள்ளூர் பகுப்பாய்வு: அதிக அபாயம்","Guardian எச்சரிக்கை","போலி அழைப்பவர் அடையாளத்தை நிரூபிக்கவில்லை","விளக்க அதிகாரி: அடையாளம் + செயல் அனுமதி","செயற்கை எண் புகார் சங்கிலியில் பதிப்பு"],details:["போலி அழைப்பவர் டிஜிட்டல் கைது என மிரட்டி பாதுகாப்புக் கணக்கிற்குப் பணம் கேட்கிறார். கற்பனைத் தொடர்பு +91 0000000000.","உலாவி விதிகள் கைது மிரட்டல், இரகசியம், பணக் கோரிக்கையைக் கண்டறியும். உரை பதிவேற்றப்படாது.","மதிப்பெண், அறிந்த உத்திகள், நிலையான சுருக்கம், நேரம் மட்டும் அனுப்பப்படும். பயிற்சி உருவகப்படுத்தும்; இணைந்த விளக்கத்திற்கு தொடர்பு தேவை.","புதிய சவாலுக்குத் தவறான டோக்கன் வருகிறது. அழைப்பவர் சரிபார்க்கப்படவில்லை. அழைப்பை நிறுத்தி பணம் செலுத்தாதீர்கள்.","தனி அழுத்தமில்லாத தகவல் கோரிக்கை நிறுவனத்தின் நடப்பு அதிகாரப்பூர்வ செயலுடன் பொருந்தும். அதிகாரி உலாவிக் கீயால் கையொப்பமிடுகிறார். முந்தைய மோசடிக் கட்டணம் அனுமதிக்கப்படவில்லை.","குடிமகன் செயற்கை எண்ணைப் புகாரளிக்கிறார்; சேவையகம் ஹாஷைச் சங்கிலியில் பதிக்கும். நிலுவையை உறுதியானதாகக் காட்டாது."],transcript:"SYNTHETIC: CBI officer பேசுகிறேன். digital arrest. உடனே safe account க்கு பணம் அனுப்பு. யாரிடமும் சொல்லாதே."},
} as const;

export const commonMessages={en:{milliseconds:"ms",seconds:"seconds",demo:"Guided demo",bytes:"bytes"},hi:{milliseconds:"मि.से.",seconds:"सेकंड",demo:"निर्देशित डेमो",bytes:"बाइट"},ta:{milliseconds:"மி.வி.",seconds:"வினாடிகள்",demo:"வழிகாட்டிய விளக்கம்",bytes:"பைட்டுகள்"}} as const;


Object.assign(registryMessages.hi.errors,{ANCHOR_BUSY_OR_MISSING:"रिपोर्ट नहीं मिली या अभी चेन पर दर्ज हो रही है। थोड़ी देर बाद फिर जाँचें।",ANCHOR_NETWORK_CHANGED:"यह रिपोर्ट दूसरी चेन या रजिस्ट्री की है। मूल नेटवर्क बहाल करें; दोबारा दर्ज न करें।"});
Object.assign(registryMessages.ta.errors,{ANCHOR_BUSY_OR_MISSING:"புகார் இல்லை அல்லது சங்கிலிப் பதிவு நடக்கிறது. சிறிது நேரத்தில் மீண்டும் பார்க்கவும்.",ANCHOR_NETWORK_CHANGED:"இந்தப் புகார் வேறு சங்கிலி அல்லது பதிவகத்திற்குரியது. அசல் அமைப்பை மீட்டமைக்கவும்; மீண்டும் பதிய வேண்டாம்."});

export const demoBackupMessages={en:{issuer:"Download encrypted institution key backup",officer:"Download encrypted officer key backup"},hi:{issuer:"एन्क्रिप्टेड संस्था कुंजी बैकअप डाउनलोड करें",officer:"एन्क्रिप्टेड अधिकारी कुंजी बैकअप डाउनलोड करें"},ta:{issuer:"மறையாக்கிய நிறுவனக் கீ காப்பைப் பதிவிறக்கு",officer:"மறையாக்கிய அதிகாரி கீ காப்பைப் பதிவிறக்கு"}} as const;

export const recoveryMessages={en:{notFound:"Page not found",back:"Back to home",error:"This page could not load. Try again.",retry:"Try again"},hi:{notFound:"पृष्ठ नहीं मिला",back:"मुख्य पृष्ठ पर लौटें",error:"यह पृष्ठ लोड नहीं हुआ। फिर प्रयास करें।",retry:"फिर प्रयास करें"},ta:{notFound:"பக்கம் இல்லை",back:"முகப்புக்குத் திரும்பு",error:"பக்கத்தை ஏற்ற முடியவில்லை. மீண்டும் முயலவும்.",retry:"மீண்டும் முயல்"}} as const;
