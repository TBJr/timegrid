import type { ZoneEntry } from "@/types";

export type CityTimeZone = {
  city: string;
  country: string;
  countryCode?: string;
  region?: string;
  timeZone: string;
  aliases?: string[];
};

export const COMMON_TIME_ZONES: CityTimeZone[] = [
  { city: "Abidjan", country: "Cote d'Ivoire", timeZone: "Africa/Abidjan" },
  { city: "Accra", country: "Ghana", timeZone: "Africa/Accra" },
  { city: "Addis Ababa", country: "Ethiopia", timeZone: "Africa/Addis_Ababa" },
  { city: "Adelaide", country: "Australia", timeZone: "Australia/Adelaide" },
  { city: "Algiers", country: "Algeria", timeZone: "Africa/Algiers" },
  { city: "Amsterdam", country: "Netherlands", timeZone: "Europe/Amsterdam" },
  { city: "Anchorage", country: "United States", timeZone: "America/Anchorage" },
  { city: "Athens", country: "Greece", timeZone: "Europe/Athens" },
  { city: "Auckland", country: "New Zealand", timeZone: "Pacific/Auckland" },
  { city: "Baghdad", country: "Iraq", timeZone: "Asia/Baghdad" },
  { city: "Bangkok", country: "Thailand", timeZone: "Asia/Bangkok" },
  { city: "Barcelona", country: "Spain", timeZone: "Europe/Madrid" },
  { city: "Beijing", country: "China", timeZone: "Asia/Shanghai" },
  { city: "Beirut", country: "Lebanon", timeZone: "Asia/Beirut" },
  { city: "Belgrade", country: "Serbia", timeZone: "Europe/Belgrade" },
  { city: "Berlin", country: "Germany", timeZone: "Europe/Berlin" },
  { city: "Bogota", country: "Colombia", timeZone: "America/Bogota" },
  { city: "Boston", country: "United States", timeZone: "America/New_York" },
  { city: "Brisbane", country: "Australia", timeZone: "Australia/Brisbane" },
  { city: "Brussels", country: "Belgium", timeZone: "Europe/Brussels" },
  { city: "Bucharest", country: "Romania", timeZone: "Europe/Bucharest" },
  { city: "Buenos Aires", country: "Argentina", timeZone: "America/Argentina/Buenos_Aires" },
  { city: "Cairo", country: "Egypt", timeZone: "Africa/Cairo" },
  { city: "Cape Town", country: "South Africa", timeZone: "Africa/Johannesburg" },
  { city: "Caracas", country: "Venezuela", timeZone: "America/Caracas" },
  { city: "Casablanca", country: "Morocco", timeZone: "Africa/Casablanca" },
  { city: "Chicago", country: "United States", timeZone: "America/Chicago" },
  { city: "Copenhagen", country: "Denmark", timeZone: "Europe/Copenhagen" },
  { city: "Dallas", country: "United States", timeZone: "America/Chicago" },
  { city: "Delhi", country: "India", timeZone: "Asia/Kolkata" },
  { city: "Denver", country: "United States", timeZone: "America/Denver" },
  { city: "Detroit", country: "United States", timeZone: "America/Detroit" },
  { city: "Doha", country: "Qatar", timeZone: "Asia/Qatar" },
  { city: "Dubai", country: "United Arab Emirates", timeZone: "Asia/Dubai" },
  { city: "Dublin", country: "Ireland", timeZone: "Europe/Dublin" },
  { city: "Frankfurt", country: "Germany", timeZone: "Europe/Berlin" },
  { city: "Geneva", country: "Switzerland", timeZone: "Europe/Zurich" },
  { city: "Guatemala City", country: "Guatemala", timeZone: "America/Guatemala" },
  { city: "Hanoi", country: "Vietnam", timeZone: "Asia/Bangkok" },
  { city: "Helsinki", country: "Finland", timeZone: "Europe/Helsinki" },
  { city: "Hong Kong", country: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  { city: "Honolulu", country: "United States", timeZone: "Pacific/Honolulu" },
  { city: "Houston", country: "United States", timeZone: "America/Chicago" },
  { city: "Istanbul", country: "Turkey", timeZone: "Europe/Istanbul" },
  { city: "Jakarta", country: "Indonesia", timeZone: "Asia/Jakarta" },
  { city: "Jerusalem", country: "Israel", timeZone: "Asia/Jerusalem" },
  { city: "Johannesburg", country: "South Africa", timeZone: "Africa/Johannesburg" },
  { city: "Karachi", country: "Pakistan", timeZone: "Asia/Karachi" },
  { city: "Kathmandu", country: "Nepal", timeZone: "Asia/Kathmandu" },
  { city: "Kolkata", country: "India", timeZone: "Asia/Kolkata" },
  { city: "Kuala Lumpur", country: "Malaysia", timeZone: "Asia/Kuala_Lumpur" },
  { city: "Lagos", country: "Nigeria", timeZone: "Africa/Lagos" },
  { city: "Lima", country: "Peru", timeZone: "America/Lima" },
  { city: "Lisbon", country: "Portugal", timeZone: "Europe/Lisbon" },
  { city: "London", country: "United Kingdom", timeZone: "Europe/London" },
  { city: "Los Angeles", country: "United States", timeZone: "America/Los_Angeles", aliases: ["LA", "Pacific"] },
  { city: "Madrid", country: "Spain", timeZone: "Europe/Madrid" },
  { city: "Manila", country: "Philippines", timeZone: "Asia/Manila" },
  { city: "Melbourne", country: "Australia", timeZone: "Australia/Melbourne" },
  { city: "Mexico City", country: "Mexico", timeZone: "America/Mexico_City" },
  { city: "Miami", country: "United States", timeZone: "America/New_York" },
  { city: "Milan", country: "Italy", timeZone: "Europe/Rome" },
  { city: "Monterrey", country: "Mexico", timeZone: "America/Monterrey" },
  { city: "Montreal", country: "Canada", timeZone: "America/Toronto" },
  { city: "Moscow", country: "Russia", timeZone: "Europe/Moscow" },
  { city: "Mumbai", country: "India", timeZone: "Asia/Kolkata" },
  { city: "Nairobi", country: "Kenya", timeZone: "Africa/Nairobi" },
  { city: "New York", country: "United States", timeZone: "America/New_York", aliases: ["Eastern", "NYC"] },
  { city: "Osaka", country: "Japan", timeZone: "Asia/Tokyo" },
  { city: "Oslo", country: "Norway", timeZone: "Europe/Oslo" },
  { city: "Paris", country: "France", timeZone: "Europe/Paris" },
  { city: "Perth", country: "Australia", timeZone: "Australia/Perth" },
  { city: "Phoenix", country: "United States", timeZone: "America/Phoenix" },
  { city: "Prague", country: "Czechia", timeZone: "Europe/Prague" },
  { city: "Reykjavik", country: "Iceland", timeZone: "Atlantic/Reykjavik" },
  { city: "Rio de Janeiro", country: "Brazil", timeZone: "America/Sao_Paulo" },
  { city: "Riyadh", country: "Saudi Arabia", timeZone: "Asia/Riyadh" },
  { city: "Rome", country: "Italy", timeZone: "Europe/Rome" },
  { city: "San Francisco", country: "United States", timeZone: "America/Los_Angeles" },
  { city: "Santiago", country: "Chile", timeZone: "America/Santiago" },
  { city: "Sao Paulo", country: "Brazil", timeZone: "America/Sao_Paulo" },
  { city: "Seattle", country: "United States", timeZone: "America/Los_Angeles" },
  { city: "Seoul", country: "South Korea", timeZone: "Asia/Seoul" },
  { city: "Shanghai", country: "China", timeZone: "Asia/Shanghai" },
  { city: "Singapore", country: "Singapore", timeZone: "Asia/Singapore" },
  { city: "Stockholm", country: "Sweden", timeZone: "Europe/Stockholm" },
  { city: "Sydney", country: "Australia", timeZone: "Australia/Sydney" },
  { city: "Taipei", country: "Taiwan", timeZone: "Asia/Taipei" },
  { city: "Tallinn", country: "Estonia", timeZone: "Europe/Tallinn" },
  { city: "Tel Aviv", country: "Israel", timeZone: "Asia/Jerusalem" },
  { city: "Tokyo", country: "Japan", timeZone: "Asia/Tokyo" },
  { city: "Toronto", country: "Canada", timeZone: "America/Toronto" },
  { city: "Vancouver", country: "Canada", timeZone: "America/Vancouver" },
  { city: "Vienna", country: "Austria", timeZone: "Europe/Vienna" },
  { city: "Warsaw", country: "Poland", timeZone: "Europe/Warsaw" },
  { city: "Washington DC", country: "United States", timeZone: "America/New_York" },
  { city: "Wellington", country: "New Zealand", timeZone: "Pacific/Auckland" },
  { city: "Zurich", country: "Switzerland", timeZone: "Europe/Zurich" }
];

const COUNTRY_CODES: Record<string, string> = {
  Algeria: "DZ",
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  "Cote d'Ivoire": "CI",
  Czechia: "CZ",
  Denmark: "DK",
  Egypt: "EG",
  Estonia: "EE",
  Ethiopia: "ET",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Guatemala: "GT",
  "Hong Kong": "HK",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  Kenya: "KE",
  Lebanon: "LB",
  Malaysia: "MY",
  Mexico: "MX",
  Morocco: "MA",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nigeria: "NG",
  Norway: "NO",
  Pakistan: "PK",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  "Saudi Arabia": "SA",
  Serbia: "RS",
  Singapore: "SG",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Thailand: "TH",
  Turkey: "TR",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  Venezuela: "VE",
  Vietnam: "VN"
};

const REGION_LABELS: Record<string, string> = {
  Africa: "Africa",
  America: "Americas",
  Antarctica: "Antarctica",
  Arctic: "Arctic",
  Asia: "Asia",
  Atlantic: "Atlantic",
  Australia: "Oceania",
  Europe: "Europe",
  Indian: "Indian Ocean",
  Pacific: "Pacific"
};

export function regionForTimeZone(timeZone: string) {
  return REGION_LABELS[timeZone.split("/")[0]] ?? "UTC";
}

export function countryCodeForCountry(country?: string) {
  return country ? COUNTRY_CODES[country] : undefined;
}

export function metadataForTimeZone(timeZone: string) {
  const match = COMMON_TIME_ZONES.find((entry) => entry.timeZone === timeZone);
  return {
    country: match?.country,
    countryCode: match?.countryCode ?? countryCodeForCountry(match?.country),
    region: match?.region ?? regionForTimeZone(timeZone)
  };
}

export function citySearchText(entry: CityTimeZone) {
  return [
    entry.city,
    entry.country,
    entry.countryCode ?? countryCodeForCountry(entry.country),
    entry.region ?? regionForTimeZone(entry.timeZone),
    entry.timeZone,
    ...(entry.aliases ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function zoneFromCity(entry: CityTimeZone, suffix: string | number = Date.now()): ZoneEntry {
  return {
    id: `${entry.city}-${entry.timeZone}-${suffix}`,
    label: entry.city,
    city: entry.city,
    country: entry.country,
    countryCode: entry.countryCode ?? countryCodeForCountry(entry.country),
    region: entry.region ?? regionForTimeZone(entry.timeZone),
    timeZone: entry.timeZone
  };
}

export function zoneFromRawTimeZone(timeZone: string, suffix: string | number = Date.now()): ZoneEntry {
  const metadata = metadataForTimeZone(timeZone);
  const label = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  return {
    id: `${timeZone}-${suffix}`,
    label,
    city: label,
    country: metadata.country,
    countryCode: metadata.countryCode,
    region: metadata.region,
    timeZone
  };
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function labelForTimeZone(timeZone: string) {
  return COMMON_TIME_ZONES.find((entry) => entry.timeZone === timeZone)?.city ?? timeZone.replace(/_/g, " ");
}
