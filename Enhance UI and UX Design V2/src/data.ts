/**
 * Data Santri dan Kontak Pengurus - Izin Sedayu v2.1.1 (Secure)
 *
 * KEAMANAN:
 * - Konfigurasi API diload secara dinamis
 * - Email whitelist divalidasi di server-side
 * - CSRF token protection
 * - Rate limiting awareness
 * - Idempotency keys untuk requests
 *
 * VERSI: v2.1.1 - Security Hardened
 */

// ============================================
// KONFIGURASI (Untuk Development - production gunakan config.json)
// ============================================

// Ambil dari environment atau use default
(function() {
    // Check for window.CONFIG first (can be set by server-side include)
    if (typeof window !== 'undefined' && window.APP_CONFIG) {
        window.GAS_WEB_APP_URL = window.APP_CONFIG.GAS_WEB_APP_URL || '';
        window.GOOGLE_CLIENT_ID = window.APP_CONFIG.GOOGLE_CLIENT_ID || '';
        window.REGISTERED_EMAILS = window.APP_CONFIG.REGISTERED_EMAILS || [];
    } else {
        // Fallback: kosong, app.js akan handle
        window.GAS_WEB_APP_URL = '';
        window.GOOGLE_CLIENT_ID = '';
        window.REGISTERED_EMAILS = [];
    }
})();

// Alias untuk kompatibilitas
export const GAS_WEB_APP_URL = window.GAS_WEB_APP_URL || '';
export const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '';
export const REGISTERED_EMAILS = window.REGISTERED_EMAILS || [];

// Data santri dan kelasnya
export const santriData = [
    {
        "name": "Agha Faeyza Barra",
        "class": "1A"
    },
    {
        "name": "Ahmad Ibrahim Al Mahmudi",
        "class": "1A"
    },
    {
        "name": "Almer Bahi Mahdy",
        "class": "1A"
    },
    {
        "name": "Ammar Abdul Aziz",
        "class": "1A"
    },
    {
        "name": "Attaya Fikri Rizqullah",
        "class": "1A"
    },
    {
        "name": "Bisma Pragaswara Suprapto",
        "class": "1A"
    },
    {
        "name": "Dava Ad Dzikri",
        "class": "1A"
    },
    {
        "name": "Dhio Itqon Ilmi Izzulhaqq",
        "class": "1A"
    },
    {
        "name": "Fajri Annaafi'u Alfarizi",
        "class": "1A"
    },
    {
        "name": "Fatih Al Faiz",
        "class": "1A"
    },
    {
        "name": "Fayzan Ghadi Safaraz",
        "class": "1A"
    },
    {
        "name": "H. Muhammad Musthofa El Akhyar Ar",
        "class": "1A"
    },
    {
        "name": "Hafeez Azmi Muhammad",
        "class": "1A"
    },
    {
        "name": "Hakam Naja Hasan",
        "class": "1A"
    },
    {
        "name": "Harits Tammam Rahman",
        "class": "1A"
    },
    {
        "name": "Ibrohim Rofiq",
        "class": "1A"
    },
    {
        "name": "Iman Ashraf Athaillah",
        "class": "1A"
    },
    {
        "name": "Khenan Naufal Dary Abiyyu",
        "class": "1A"
    },
    {
        "name": "Mikail Ahmad Zaidan",
        "class": "1A"
    },
    {
        "name": "Moh. Athariz Chalief Hamidy",
        "class": "1A"
    },
    {
        "name": "Muhamad Fathan Sakhi Zaidan",
        "class": "1A"
    },
    {
        "name": "Muhammad Azmi An Najah",
        "class": "1A"
    },
    {
        "name": "Muhammad Hafis Makarim",
        "class": "1A"
    },
    {
        "name": "Muhammad Robii'ul Awwal",
        "class": "1A"
    },
    {
        "name": "Radhin Nabil Alauna",
        "class": "1A"
    },
    {
        "name": "Rafa Rizki Ramadhansyah Haris",
        "class": "1A"
    },
    {
        "name": "Rajendra Zhafran Arsaputra",
        "class": "1A"
    },
    {
        "name": "Salman Abqary Haidar Al Hanif",
        "class": "1A"
    },
    {
        "name": "Wisanggeni Pamungkas Pamujaning Rheinandy",
        "class": "1A"
    },
    {
        "name": "Zidan Al Fatir Siregar",
        "class": "1A"
    },
    {
        "name": "A.Dinar Sayuto",
        "class": "1B"
    },
    {
        "name": "Adhyastha Ainur Rizky",
        "class": "1B"
    },
    {
        "name": "Aditya Giri Reksa Nu’aimi",
        "class": "1B"
    },
    {
        "name": "Alaika Syamil Al-Hadzik",
        "class": "1B"
    },
    {
        "name": "Arjuna Satria Pradipta",
        "class": "1B"
    },
    {
        "name": "Aryatama Febrian Danendra",
        "class": "1B"
    },
    {
        "name": "Faiz Fadhlurrahman",
        "class": "1B"
    },
    {
        "name": "Faqih Keyaanurasyid",
        "class": "1B"
    },
    {
        "name": "Fauzan Nur Hidayat",
        "class": "1B"
    },
    {
        "name": "Fazila Akbar Ikhlas",
        "class": "1B"
    },
    {
        "name": "Firnas Alfariel",
        "class": "1B"
    },
    {
        "name": "Hafizh Nizar Prasetya",
        "class": "1B"
    },
    {
        "name": "Ibrahim Al Azzam",
        "class": "1B"
    },
    {
        "name": "Ilian Badranaya El Qurafi",
        "class": "1B"
    },
    {
        "name": "Kenzo Zafran Al Abiyyu",
        "class": "1B"
    },
    {
        "name": "Lintang Mahardika",
        "class": "1B"
    },
    {
        "name": "Muhammad Alkhali Dzikri",
        "class": "1B"
    },
    {
        "name": "Muhammad Azzam Al Fatih",
        "class": "1B"
    },
    {
        "name": "Muhammad Elvin Ishahda",
        "class": "1B"
    },
    {
        "name": "Muhammad Farrel Anhar",
        "class": "1B"
    },
    {
        "name": "Muhammad Fatih El Ezza",
        "class": "1B"
    },
    {
        "name": "Muhammad Ghozi Al Faruqi",
        "class": "1B"
    },
    {
        "name": "Naufal Afkar",
        "class": "1B"
    },
    {
        "name": "Nirwaseta Putra Purnama",
        "class": "1B"
    },
    {
        "name": "Raditya Asyam Adz Dzaqi",
        "class": "1B"
    },
    {
        "name": "Rakha Naufal Alfarisi",
        "class": "1B"
    },
    {
        "name": "Rifat Inet Firas",
        "class": "1B"
    },
    {
        "name": "Sayeed Muhammad 'Alauddin Fakhri",
        "class": "1B"
    },
    {
        "name": "Wildan Hawwari",
        "class": "1B"
    },
    {
        "name": "Zafran Ilham Sujati",
        "class": "1B"
    },
    {
        "name": "Zaky Fakhry Yanto",
        "class": "1B"
    },
    {
        "name": "Abdullah Alfaqih",
        "class": "1C"
    },
    {
        "name": "Ahlam Zulfadli Firdaus",
        "class": "1C"
    },
    {
        "name": "Ahmad Mumtaz Dhiya El Haq",
        "class": "1C"
    },
    {
        "name": "Ahmad Zufar Syamaidzar",
        "class": "1C"
    },
    {
        "name": "Ahsan Abdullah Nasution",
        "class": "1C"
    },
    {
        "name": "Ahsan Rafif Aditya",
        "class": "1C"
    },
    {
        "name": "Arsyad Farkhi Ismail",
        "class": "1C"
    },
    {
        "name": "Azfar Rayyan Al Farisi",
        "class": "1C"
    },
    {
        "name": "Fadlliy Dzaka Triyono",
        "class": "1C"
    },
    {
        "name": "Habibie Musthofa Reenosady",
        "class": "1C"
    },
    {
        "name": "Hayatamam Al Abra",
        "class": "1C"
    },
    {
        "name": "Ibrahim Rizqy Nugroho",
        "class": "1C"
    },
    {
        "name": "Kenzie Abdurahman Haziq",
        "class": "1C"
    },
    {
        "name": "Khadafi Atha Al Barra",
        "class": "1C"
    },
    {
        "name": "Luqman Hakim",
        "class": "1C"
    },
    {
        "name": "Maulana Dzaki Husnayain",
        "class": "1C"
    },
    {
        "name": "Muhammad Azhar Nazhifurrahman",
        "class": "1C"
    },
    {
        "name": "Muhammad Bilal Najmu Tsaqib",
        "class": "1C"
    },
    {
        "name": "Muhammad Dhiaa El Haq",
        "class": "1C"
    },
    {
        "name": "Muhammad Hanif Adhinugraha",
        "class": "1C"
    },
    {
        "name": "Muhammad Ikhsan Fadhilah",
        "class": "1C"
    },
    {
        "name": "Muhammad Irsyad Wijaya",
        "class": "1C"
    },
    {
        "name": "Muhammad Jibril Assyafi Syaifullah",
        "class": "1C"
    },
    {
        "name": "Muhammad Rayhan Ar Rayyan Wijaya",
        "class": "1C"
    },
    {
        "name": "Nabiyulloh Ibnu Huda",
        "class": "1C"
    },
    {
        "name": "Rafiandra Yusuf Al-Ghifari",
        "class": "1C"
    },
    {
        "name": "Raihan Nizar Daniswara",
        "class": "1C"
    },
    {
        "name": "Reffa Al-Azhar Subagiyo",
        "class": "1C"
    },
    {
        "name": "Wenang Eglo Arto",
        "class": "1C"
    },
    {
        "name": "Zhafran Ramadhan",
        "class": "1C"
    },
    {
        "name": "Ahmad Amirul A'zam",
        "class": "1D"
    },
    {
        "name": "Allardo Sultan Altansyah",
        "class": "1D"
    },
    {
        "name": "Anindya Mughni Kalingga",
        "class": "1D"
    },
    {
        "name": "Arfa Narendra Nugroho",
        "class": "1D"
    },
    {
        "name": "Athariz Zidane Ferdiansyah",
        "class": "1D"
    },
    {
        "name": "Atharizz Andistyo Ghiffari",
        "class": "1D"
    },
    {
        "name": "Atillah Azfar Rasyid",
        "class": "1D"
    },
    {
        "name": "Azmi Hail",
        "class": "1D"
    },
    {
        "name": "Azzam Fahrezzi Shaquille",
        "class": "1D"
    },
    {
        "name": "Cemal Rizqy Hibatullah Al - Azzam",
        "class": "1D"
    },
    {
        "name": "Daniswara Alvis Nurrizqi",
        "class": "1D"
    },
    {
        "name": "Dzulfadli Agra Firmansyah",
        "class": "1D"
    },
    {
        "name": "Fairel Atharizz Chalief",
        "class": "1D"
    },
    {
        "name": "Faith Zirah El Fathir Triono",
        "class": "1D"
    },
    {
        "name": "Jaris Jalu Randita",
        "class": "1D"
    },
    {
        "name": "Kamaalul Firdaus",
        "class": "1D"
    },
    {
        "name": "Kaysan Shahzada Sabih",
        "class": "1D"
    },
    {
        "name": "Mifzal Assyauqi Muhammad",
        "class": "1D"
    },
    {
        "name": "Muhammad Admiral Atthobari Yatalathof",
        "class": "1D"
    },
    {
        "name": "Muhammad Ahnaf Isnandika",
        "class": "1D"
    },
    {
        "name": "Muhammad Airlangga Abbyansyah Fajar",
        "class": "1D"
    },
    {
        "name": "Muhammad Alfano Abqary Pratama",
        "class": "1D"
    },
    {
        "name": "Muhammad Azghan Aushafi Prasetyo",
        "class": "1D"
    },
    {
        "name": "Muhammad Bagus Al Farizi",
        "class": "1D"
    },
    {
        "name": "Muhammad Fahry",
        "class": "1D"
    },
    {
        "name": "Muhammad Nizam Justice Aryansyah",
        "class": "1D"
    },
    {
        "name": "Nadzif Azzam Al Vaizi",
        "class": "1D"
    },
    {
        "name": "Nararya Rizqi Ananditya",
        "class": "1D"
    },
    {
        "name": "Salahuddin Nafis Al Farisi",
        "class": "1D"
    },
    {
        "name": "Syamil Ramadhani Saputra",
        "class": "1D"
    },
    {
        "name": "Tsaqiif Yaafi' Tri Nugroho",
        "class": "1D"
    },
    {
        "name": "Abuwildan Najid Arrasyad",
        "class": "1E"
    },
    {
        "name": "Afif Agil Saputra",
        "class": "1E"
    },
    {
        "name": "Alief Rohman Hidayat",
        "class": "1E"
    },
    {
        "name": "Arsyad Faza El - Rafif",
        "class": "1E"
    },
    {
        "name": "Azka Rafif Khafadi",
        "class": "1E"
    },
    {
        "name": "Chelsea Safaraz Majiid",
        "class": "1E"
    },
    {
        "name": "Daffa Fritzie Alghifari",
        "class": "1E"
    },
    {
        "name": "Danes Edgar Abdima Pratama",
        "class": "1E"
    },
    {
        "name": "Evan Rafif Firjatullah",
        "class": "1E"
    },
    {
        "name": "Faaza Muhammad Widaad",
        "class": "1E"
    },
    {
        "name": "Faeyza Azizan Santoso",
        "class": "1E"
    },
    {
        "name": "Fardan Rasya Bofatra",
        "class": "1E"
    },
    {
        "name": "Hafidz Ramadhani",
        "class": "1E"
    },
    {
        "name": "Hamizan Uays Arsy",
        "class": "1E"
    },
    {
        "name": "Hamizan Yafiq Azfar",
        "class": "1E"
    },
    {
        "name": "Ibrahim Arkaan Dhiya Ulhaq",
        "class": "1E"
    },
    {
        "name": "Ihtisyam Al Quds Anas",
        "class": "1E"
    },
    {
        "name": "Jinan Kiano Saba",
        "class": "1E"
    },
    {
        "name": "Mahatma Putra Insani",
        "class": "1E"
    },
    {
        "name": "Muhammad Abdul Rasyid",
        "class": "1E"
    },
    {
        "name": "Muhammad Arif Fatikhayat",
        "class": "1E"
    },
    {
        "name": "Muhammad Arya Pamenang",
        "class": "1E"
    },
    {
        "name": "Muhammad Dhanurendra Abhimata Wihrasto",
        "class": "1E"
    },
    {
        "name": "Muhammad Fadlan Kurnia",
        "class": "1E"
    },
    {
        "name": "Muhammad Lantang Wirayudha Akbar",
        "class": "1E"
    },
    {
        "name": "Muhammad Ziyad Avicenna",
        "class": "1E"
    },
    {
        "name": "Nabhan Ghazy Pradipta",
        "class": "1E"
    },
    {
        "name": "Randa Kamil Bahta",
        "class": "1E"
    },
    {
        "name": "Rayyan Al-Hamdy",
        "class": "1E"
    },
    {
        "name": "Syauqi Musyaffa Fikri",
        "class": "1E"
    },
    {
        "name": "Acapella Akbar Alhafizh Hartono",
        "class": "1F"
    },
    {
        "name": "Aditya Ainurrahman",
        "class": "1F"
    },
    {
        "name": "Agna Nizama Khalif Diniy Adz Zaki",
        "class": "1F"
    },
    {
        "name": "Ahmad Kenzie Kayana",
        "class": "1F"
    },
    {
        "name": "Ahsan El Amin",
        "class": "1F"
    },
    {
        "name": "Arakata Aqila Jannahpia",
        "class": "1F"
    },
    {
        "name": "Ararya Genius El Hafizh Nugroho",
        "class": "1F"
    },
    {
        "name": "Asadulloh Al-Fathnany",
        "class": "1F"
    },
    {
        "name": "Aufaa Al Ghifari",
        "class": "1F"
    },
    {
        "name": "Bisma Hilal Mahadika Abiyu Haidar",
        "class": "1F"
    },
    {
        "name": "Davin Al Nazri",
        "class": "1F"
    },
    {
        "name": "Faqih Ibnu Iskandar",
        "class": "1F"
    },
    {
        "name": "Hafiz Mursi Ramadhan",
        "class": "1F"
    },
    {
        "name": "Hamdan Pandega",
        "class": "1F"
    },
    {
        "name": "Kennard Belmiro Asmara",
        "class": "1F"
    },
    {
        "name": "Latief Haziq Maulana",
        "class": "1F"
    },
    {
        "name": "Lazward Mumtaz Ahmad Adz Dzaky",
        "class": "1F"
    },
    {
        "name": "Lionel Ibrahim Althof",
        "class": "1F"
    },
    {
        "name": "Luthfi Muhammad Zaky",
        "class": "1F"
    },
    {
        "name": "Luvairel Atharizz Calief",
        "class": "1F"
    },
    {
        "name": "M. Adib Keenan Wahyudianto",
        "class": "1F"
    },
    {
        "name": "Muhammad Afadana Elfaza",
        "class": "1F"
    },
    {
        "name": "Muhammad Naufal Rahman",
        "class": "1F"
    },
    {
        "name": "Muhammad Rioki Alfath",
        "class": "1F"
    },
    {
        "name": "Muhammad Roykhan Arkana",
        "class": "1F"
    },
    {
        "name": "Rasyid Azka Alvaro",
        "class": "1F"
    },
    {
        "name": "Razan Javier Syarof",
        "class": "1F"
    },
    {
        "name": "Uwais Naufal El Kamal",
        "class": "1F"
    },
    {
        "name": "Yusuf Arfa",
        "class": "1F"
    },
    {
        "name": "Zufar Calief Nurdaffa",
        "class": "1F"
    },
    {
        "name": "Adam Iskandar",
        "class": "1G"
    },
    {
        "name": "Ammar Tejananta Himawan",
        "class": "1G"
    },
    {
        "name": "Amsyar Fadhlurrahman Setyawan",
        "class": "1G"
    },
    {
        "name": "Arundaya Wisanggeni Ma'arif",
        "class": "1G"
    },
    {
        "name": "Bara Putra Pratama",
        "class": "1G"
    },
    {
        "name": "Dydan Yusuf Ivander",
        "class": "1G"
    },
    {
        "name": "Fa Virendra Ahza",
        "class": "1G"
    },
    {
        "name": "Fadhil Akhtar Hartono",
        "class": "1G"
    },
    {
        "name": "Fatih Shuja Arkana",
        "class": "1G"
    },
    {
        "name": "Hilmi Ar Raihan",
        "class": "1G"
    },
    {
        "name": "Hisyam Aufa Syarif",
        "class": "1G"
    },
    {
        "name": "Lisan Shidqie",
        "class": "1G"
    },
    {
        "name": "Mochammad Fauzan Wardana",
        "class": "1G"
    },
    {
        "name": "Muhammad Aksan Al Fatih",
        "class": "1G"
    },
    {
        "name": "Muhammad Faeyza Alvaro Ardiansyah",
        "class": "1G"
    },
    {
        "name": "Muhammad Marselin Seto Jovanka",
        "class": "1G"
    },
    {
        "name": "Muhammad Nur Bilal",
        "class": "1G"
    },
    {
        "name": "Muhammad Ozil",
        "class": "1G"
    },
    {
        "name": "Muhammad Qoidun Nafi' Al Murtadho",
        "class": "1G"
    },
    {
        "name": "Muhammad Syauqi Chusairi",
        "class": "1G"
    },
    {
        "name": "Muhammad Tsaqib Azizan Rabbani",
        "class": "1G"
    },
    {
        "name": "Muhammad Yafik Ubaidillah",
        "class": "1G"
    },
    {
        "name": "Primadona Apriliano Putra Budianto",
        "class": "1G"
    },
    {
        "name": "Raditya Candra Arsakha",
        "class": "1G"
    },
    {
        "name": "Ravindra Putra Pramudya",
        "class": "1G"
    },
    {
        "name": "Riffat Ahsan Al Ghifari",
        "class": "1G"
    },
    {
        "name": "Sultan Fizhansyah Fauzi",
        "class": "1G"
    },
    {
        "name": "Sulthan Alfaraby Abduh",
        "class": "1G"
    },
    {
        "name": "Taj Azri Akmal",
        "class": "1G"
    },
    {
        "name": "Yudhistira Putra Prabowo",
        "class": "1G"
    },
    {
        "name": "Abid Tsaqif Atha Jati",
        "class": "1LOWERA"
    },
    {
        "name": "Ahza Danish Fahreza",
        "class": "1LOWERA"
    },
    {
        "name": "Akhtar Haidar Arief",
        "class": "1LOWERA"
    },
    {
        "name": "Andik Dwi Prayoga",
        "class": "1LOWERA"
    },
    {
        "name": "Bilal Abdurrohman Sholih",
        "class": "1LOWERA"
    },
    {
        "name": "Daffa Saad Rafie",
        "class": "1LOWERA"
    },
    {
        "name": "Danendra Athallah Zaheen",
        "class": "1LOWERA"
    },
    {
        "name": "Excellendra Azka Raffaza",
        "class": "1LOWERA"
    },
    {
        "name": "Fajri Fakhri IW",
        "class": "1LOWERA"
    },
    {
        "name": "Fikri Nur Fauzan",
        "class": "1LOWERA"
    },
    {
        "name": "Muhammad Alfath Arroyyan",
        "class": "1LOWERA"
    },
    {
        "name": "Muhammad Ziyad Akhsan",
        "class": "1LOWERA"
    },
    {
        "name": "Nara Ganindhira Albar",
        "class": "1LOWERA"
    },
    {
        "name": "Pangkala Fiqra El Ghazali",
        "class": "1LOWERA"
    },
    {
        "name": "Pramudya Achsan Kamil",
        "class": "1LOWERA"
    },
    {
        "name": "Rafa Ulil Azmi",
        "class": "1LOWERA"
    },
    {
        "name": "Rangga prasetyo anandika",
        "class": "1LOWERA"
    },
    {
        "name": "Raufa Arkhan Akhtara",
        "class": "1LOWERA"
    },
    {
        "name": "Abimantrana Keitaro Jevera",
        "class": "1LOWERB"
    },
    {
        "name": "Agha Faeyza El Rafif",
        "class": "1LOWERB"
    },
    {
        "name": "Athiillaah Andharu Fatah",
        "class": "1LOWERB"
    },
    {
        "name": "Daffa Mibras Ghosan",
        "class": "1LOWERB"
    },
    {
        "name": "Fardan Althaf Firdausi",
        "class": "1LOWERB"
    },
    {
        "name": "Gaza Raditya Sagoro",
        "class": "1LOWERB"
    },
    {
        "name": "Haldis Ghazain Rafay Arif",
        "class": "1LOWERB"
    },
    {
        "name": "Kai Raska Ibrahim",
        "class": "1LOWERB"
    },
    {
        "name": "Kareem Abraham",
        "class": "1LOWERB"
    },
    {
        "name": "Muhammad Arizar Reezqyandra",
        "class": "1LOWERB"
    },
    {
        "name": "Muhammad Haekal Abdullah Andreago",
        "class": "1LOWERB"
    },
    {
        "name": "Muhammad Raffi Ayman Shah",
        "class": "1LOWERB"
    },
    {
        "name": "Najmussyafi' Zimamul Haq",
        "class": "1LOWERB"
    },
    {
        "name": "Rauf Hilmi Munajad",
        "class": "1LOWERB"
    },
    {
        "name": "Ryuuta Mikan Abdullah",
        "class": "1LOWERB"
    },
    {
        "name": "Sayyaf Maulavi Barra Al Hafsh",
        "class": "1LOWERB"
    },
    {
        "name": "Sunan Bumi Al Quraisj",
        "class": "1LOWERB"
    },
    {
        "name": "Ukail Madani",
        "class": "1LOWERB"
    },
    {
        "name": "Zaidan Arkaan Adisya",
        "class": "1LOWERB"
    },
    {
        "name": "Bara Habibi Tama",
        "class": "1LOWERC"
    },
    {
        "name": "Bilal Geno Al Ghaisan",
        "class": "1LOWERC"
    },
    {
        "name": "Bilal Hamasah",
        "class": "1LOWERC"
    },
    {
        "name": "Ibnu Hafidz Elfathin",
        "class": "1LOWERC"
    },
    {
        "name": "Kenzi Agil Saryoso",
        "class": "1LOWERC"
    },
    {
        "name": "Muhammad Afif Azizan",
        "class": "1LOWERC"
    },
    {
        "name": "Muhammad Al Fatih",
        "class": "1LOWERC"
    },
    {
        "name": "Muhammad Haikal Akram",
        "class": "1LOWERC"
    },
    {
        "name": "Muhammad Khalifa Ashshiddiq",
        "class": "1LOWERC"
    },
    {
        "name": "Muhammad Zhafran Mumtaz Usman",
        "class": "1LOWERC"
    },
    {
        "name": "Naryama Ascarya Rauf",
        "class": "1LOWERC"
    },
    {
        "name": "Naufal Ahnaf Abqary",
        "class": "1LOWERC"
    },
    {
        "name": "Nawwar Sukma",
        "class": "1LOWERC"
    },
    {
        "name": "Prabu Airlangga Wicaksono",
        "class": "1LOWERC"
    },
    {
        "name": "R. Maheswara Abiyasa Narawata",
        "class": "1LOWERC"
    },
    {
        "name": "Rizqi suryanata",
        "class": "1LOWERC"
    },
    {
        "name": "Yuda Prawira Arifin",
        "class": "1LOWERC"
    },
    {
        "name": "Zulfadhli Muhammad Fayyadh Afkar",
        "class": "1LOWERC"
    },
    {
        "name": "Achmad Raffasya Izzudin Althafurrahman",
        "class": "2A"
    },
    {
        "name": "Ahmad Abdullah Azzam Syah",
        "class": "2A"
    },
    {
        "name": "Arta Nugraha",
        "class": "2A"
    },
    {
        "name": "Asyam Ramadhan Prabowo",
        "class": "2A"
    },
    {
        "name": "Athallah Kareem Aljabar",
        "class": "2A"
    },
    {
        "name": "Bariq Alfath Abdhila Putra",
        "class": "2A"
    },
    {
        "name": "Chalief Mibras El Rafif",
        "class": "2A"
    },
    {
        "name": "Dimas Andika Saputra",
        "class": "2A"
    },
    {
        "name": "Fadhlan Zia Muhammad Fawwaz",
        "class": "2A"
    },
    {
        "name": "Ghaisan Aidan Maheswara",
        "class": "2A"
    },
    {
        "name": "Haidar Azfar Abdurrahman",
        "class": "2A"
    },
    {
        "name": "Hamizan Fatih Abdurrahman",
        "class": "2A"
    },
    {
        "name": "Indonesia Setya Tjitro Soediro",
        "class": "2A"
    },
    {
        "name": "Insan Firdaus Alfaathir",
        "class": "2A"
    },
    {
        "name": "Luth Adwa' Aban Widagdo",
        "class": "2A"
    },
    {
        "name": "Muh. Ahsanurrijal",
        "class": "2A"
    },
    {
        "name": "Muhammad Afifuddin",
        "class": "2A"
    },
    {
        "name": "Muhammad Agra Raditya",
        "class": "2A"
    },
    {
        "name": "Muhammad Ahsan Azizurrahman",
        "class": "2A"
    },
    {
        "name": "Muhammad Aufar Raqilla",
        "class": "2A"
    },
    {
        "name": "Muhammad Elhijry Sabilul Ihsan",
        "class": "2A"
    },
    {
        "name": "Muhammad Faisal Abdurrahman",
        "class": "2A"
    },
    {
        "name": "Muhammad Hanif Alhafizh",
        "class": "2A"
    },
    {
        "name": "Muhammad Hanif Saputra",
        "class": "2A"
    },
    {
        "name": "Muhammad Mumtaz Al-Dzahabiy",
        "class": "2A"
    },
    {
        "name": "Muhammad Rausan Bayhaqi Mustafid",
        "class": "2A"
    },
    {
        "name": "Muhammad Thoriq Faizullah Rahman",
        "class": "2A"
    },
    {
        "name": "Muhammad Zuhairy Purnomo",
        "class": "2A"
    },
    {
        "name": "Nabil Abriansa",
        "class": "2A"
    },
    {
        "name": "Naizar Abrisam",
        "class": "2A"
    },
    {
        "name": "Rafif Zikri Makarim",
        "class": "2A"
    },
    {
        "name": "Razan Rashdan Rakhshan Hidayatullah",
        "class": "2A"
    },
    {
        "name": "Abhivandya Ahmad Hazmi Ardhie",
        "class": "2B"
    },
    {
        "name": "Abrisam Balapradhana",
        "class": "2B"
    },
    {
        "name": "Ahmad Khayruddin Fahmi",
        "class": "2B"
    },
    {
        "name": "Ahnaf Asykarullah Raka Pambayun",
        "class": "2B"
    },
    {
        "name": "Ahnaf Faiz Khalifah",
        "class": "2B"
    },
    {
        "name": "Ahnaf Kiano Arsakha Azzala",
        "class": "2B"
    },
    {
        "name": "Al Wazif",
        "class": "2B"
    },
    {
        "name": "Atha Faadhil Arfiansyah",
        "class": "2B"
    },
    {
        "name": "Athallah Sidqi As Sakha",
        "class": "2B"
    },
    {
        "name": "Athoulloh Ulinnuha Zaidan Agestya",
        "class": "2B"
    },
    {
        "name": "Atsaal Dzamar Gunawan",
        "class": "2B"
    },
    {
        "name": "Dzaky Muhammad El Faiz",
        "class": "2B"
    },
    {
        "name": "Falah",
        "class": "2B"
    },
    {
        "name": "Farih Said Al Ghany",
        "class": "2B"
    },
    {
        "name": "Fatih Arfian Aryasatya",
        "class": "2B"
    },
    {
        "name": "Gibran Akma Ukhail",
        "class": "2B"
    },
    {
        "name": "Hanif Ilman Nuha",
        "class": "2B"
    },
    {
        "name": "Keanu Utsman Afrianto",
        "class": "2B"
    },
    {
        "name": "Maizar Rahman",
        "class": "2B"
    },
    {
        "name": "Mikael Keano El Aziz",
        "class": "2B"
    },
    {
        "name": "Muhammad Gibran Habiburrahman",
        "class": "2B"
    },
    {
        "name": "Muhammad Hisyam Al Hakim",
        "class": "2B"
    },
    {
        "name": "Muhammad Kautsar Zia Firmansyah",
        "class": "2B"
    },
    {
        "name": "Muhammad Nizam Al Kahfi",
        "class": "2B"
    },
    {
        "name": "Nasif Adwa Syahmi",
        "class": "2B"
    },
    {
        "name": "Naufal Fadhil Syahputra",
        "class": "2B"
    },
    {
        "name": "Naufal Kenzie Afiya Prayata",
        "class": "2B"
    },
    {
        "name": "Noor Muhammad Allafa Khalilarrahman Budiharto",
        "class": "2B"
    },
    {
        "name": "Rizky Mirza Abdillah",
        "class": "2B"
    },
    {
        "name": "Safaraz Aria Akma Fadhil",
        "class": "2B"
    },
    {
        "name": "Zhafran Fauzi Rohman",
        "class": "2B"
    },
    {
        "name": "Zulfadli Irbah Adam Syam",
        "class": "2B"
    },
    {
        "name": "Abdul Majid Siregar",
        "class": "2C"
    },
    {
        "name": "Abid Zaini",
        "class": "2C"
    },
    {
        "name": "Abidzar Naufal Al Ghifary As'ad Chalik",
        "class": "2C"
    },
    {
        "name": "Adzhani Ahmad Zuhayr",
        "class": "2C"
    },
    {
        "name": "Ahmad Kamil Assadad",
        "class": "2C"
    },
    {
        "name": "Ahmad Najwan Karnanda",
        "class": "2C"
    },
    {
        "name": "Ahmad Wira Aryasatya",
        "class": "2C"
    },
    {
        "name": "Alvaro Davin Priatna",
        "class": "2C"
    },
    {
        "name": "Amirullah Rinto Waskita",
        "class": "2C"
    },
    {
        "name": "Ebeesio Aquillino Jeevan Setyawan",
        "class": "2C"
    },
    {
        "name": "Excel Yanuar Arya Syahrial",
        "class": "2C"
    },
    {
        "name": "Fahma Faizullah",
        "class": "2C"
    },
    {
        "name": "Gadang Maulana Zulkarnaen",
        "class": "2C"
    },
    {
        "name": "Hafiz Arma Kusuma",
        "class": "2C"
    },
    {
        "name": "Karim Alparslan",
        "class": "2C"
    },
    {
        "name": "Kenzie Rafiandra Putra",
        "class": "2C"
    },
    {
        "name": "Kenzie Ryuu Muhammad Pria Utama",
        "class": "2C"
    },
    {
        "name": "Muhammad Adnan Wibowo",
        "class": "2C"
    },
    {
        "name": "Muhammad Fadhil Ramadhan",
        "class": "2C"
    },
    {
        "name": "Muhammad Ibnu Rasyid Widiyatmoko",
        "class": "2C"
    },
    {
        "name": "Muhammad Mahardika Al Ghozy",
        "class": "2C"
    },
    {
        "name": "Muhammad Niamullah Alqoony",
        "class": "2C"
    },
    {
        "name": "Muhammad Yusuf Alvaro",
        "class": "2C"
    },
    {
        "name": "Nabil Farrasy Rusdin",
        "class": "2C"
    },
    {
        "name": "Nathan Ranadja Alfarabi",
        "class": "2C"
    },
    {
        "name": "Rasya Aisyyuant Wistara",
        "class": "2C"
    },
    {
        "name": "Rayandra Muhammad Ghaizan Zidain",
        "class": "2C"
    },
    {
        "name": "Rayyan Nabil Al Faruq",
        "class": "2C"
    },
    {
        "name": "Wildan Amar Rasuli",
        "class": "2C"
    },
    {
        "name": "Zaverio Ozil Riyadi",
        "class": "2C"
    },
    {
        "name": "Abdullah Raya Nureno",
        "class": "2D"
    },
    {
        "name": "Abid Irsyad Nur Fadhil",
        "class": "2D"
    },
    {
        "name": "Ahmad Shafhal Jamil",
        "class": "2D"
    },
    {
        "name": "Akhdan Bazla Ar-Sakha",
        "class": "2D"
    },
    {
        "name": "Akhmad Sakhi Musyaffa Syahid",
        "class": "2D"
    },
    {
        "name": "Alessandro El Fathih Siregar",
        "class": "2D"
    },
    {
        "name": "Altaf Anargya Ardian",
        "class": "2D"
    },
    {
        "name": "Arfa Mufid Baihaqi",
        "class": "2D"
    },
    {
        "name": "Arka Panodi Widyanatha",
        "class": "2D"
    },
    {
        "name": "Atha Saverio Maheswara P.",
        "class": "2D"
    },
    {
        "name": "Azka Aiman Najwaan",
        "class": "2D"
    },
    {
        "name": "Devans Faiz Al-Faruq",
        "class": "2D"
    },
    {
        "name": "Dhirar Alamgir",
        "class": "2D"
    },
    {
        "name": "Fadhil Askar Parakas",
        "class": "2D"
    },
    {
        "name": "Fadhil Brilliant Avicena",
        "class": "2D"
    },
    {
        "name": "Gantheng Poerba Ilyasa",
        "class": "2D"
    },
    {
        "name": "Hanan Rasyid Yunur",
        "class": "2D"
    },
    {
        "name": "Iqra Garda Nusantara",
        "class": "2D"
    },
    {
        "name": "M. Zidan Al Faruq",
        "class": "2D"
    },
    {
        "name": "Mahardika Aqmar Adhitama",
        "class": "2D"
    },
    {
        "name": "Manggala Brilian Mughni Aflah",
        "class": "2D"
    },
    {
        "name": "Muh. Wafinabil Adiwangsa",
        "class": "2D"
    },
    {
        "name": "Muhammad Azsyam Shidqi Rafello",
        "class": "2D"
    },
    {
        "name": "Muhammad Hakam Tsaqif",
        "class": "2D"
    },
    {
        "name": "Muhammad Imamul Haq",
        "class": "2D"
    },
    {
        "name": "Muhammad Najmus Tsaaqib",
        "class": "2D"
    },
    {
        "name": "Muhammad Naufal Afkar Arkham",
        "class": "2D"
    },
    {
        "name": "Muhammad Rifqi An Naufal",
        "class": "2D"
    },
    {
        "name": "Muhammad Syafiqurrahman",
        "class": "2D"
    },
    {
        "name": "Muhammad Syahid Al Islam",
        "class": "2D"
    },
    {
        "name": "Abdullah Hasni Bramapta",
        "class": "2E"
    },
    {
        "name": "Alif Alfarizqi Annur Rohman",
        "class": "2E"
    },
    {
        "name": "Alif Muhsin Mubarok",
        "class": "2E"
    },
    {
        "name": "Arka Faeyza",
        "class": "2E"
    },
    {
        "name": "Arya Satya Yusuf Pratama",
        "class": "2E"
    },
    {
        "name": "Danendra Irkham Surahman",
        "class": "2E"
    },
    {
        "name": "Dzaky Hariri Akbar Raziq",
        "class": "2E"
    },
    {
        "name": "Fadhil Abid Abyan",
        "class": "2E"
    },
    {
        "name": "Faiz Aulia Arif",
        "class": "2E"
    },
    {
        "name": "Fathirshah Bryan Arkadiandra",
        "class": "2E"
    },
    {
        "name": "Ghaisan Alvaro Hakim",
        "class": "2E"
    },
    {
        "name": "Hafizh Adiyatma Nugraha",
        "class": "2E"
    },
    {
        "name": "Haris Yusuf Fiqri",
        "class": "2E"
    },
    {
        "name": "Hilmi Adi Al Falah",
        "class": "2E"
    },
    {
        "name": "Isfha Khaizuran Nafie'",
        "class": "2E"
    },
    {
        "name": "Kevin Wahyu Ilahi",
        "class": "2E"
    },
    {
        "name": "M Arkan Yazid Pasaribu",
        "class": "2E"
    },
    {
        "name": "Mirza Rasyid Dimyati",
        "class": "2E"
    },
    {
        "name": "Mohammad Raffa Abqory Alfarizqy",
        "class": "2E"
    },
    {
        "name": "Muhamad Anugrah Putra Persada",
        "class": "2E"
    },
    {
        "name": "Muhammad Aisar I'zaz",
        "class": "2E"
    },
    {
        "name": "Muhammad Arya Madha",
        "class": "2E"
    },
    {
        "name": "Muhammad Fadhil Rosyid",
        "class": "2E"
    },
    {
        "name": "Muhammad Ferdinan Adinata",
        "class": "2E"
    },
    {
        "name": "Muhammad Fikra Avicena",
        "class": "2E"
    },
    {
        "name": "Muhammad Ihsan Zahirulhaq",
        "class": "2E"
    },
    {
        "name": "Muhammad Kurniawan Putranto",
        "class": "2E"
    },
    {
        "name": "Muhammad Nabhan Nur Muhtadin",
        "class": "2E"
    },
    {
        "name": "Muhammad Noufal Firmansyah",
        "class": "2E"
    },
    {
        "name": "Zora Phalosa Nareswara",
        "class": "2E"
    },
    {
        "name": "Affan Valerino Alfarisqy",
        "class": "2F"
    },
    {
        "name": "Ataya Chairu El Firdaus",
        "class": "2F"
    },
    {
        "name": "Axel Putra Firdaus",
        "class": "2F"
    },
    {
        "name": "Azam Zufar Keyara",
        "class": "2F"
    },
    {
        "name": "Azmi Ismail Adha",
        "class": "2F"
    },
    {
        "name": "Emir Muhammad Atsal Himawan",
        "class": "2F"
    },
    {
        "name": "Faiq Rosyad Habibie",
        "class": "2F"
    },
    {
        "name": "Fathan Naufal Budiman",
        "class": "2F"
    },
    {
        "name": "Hiroku Abdillah Pertama",
        "class": "2F"
    },
    {
        "name": "Hisyam Amrullah Baqir",
        "class": "2F"
    },
    {
        "name": "Jovan Alvaro Kurniawan",
        "class": "2F"
    },
    {
        "name": "Kamaludin Ikhsan",
        "class": "2F"
    },
    {
        "name": "Mahardika Nafi' Satrio Nugroho",
        "class": "2F"
    },
    {
        "name": "Muh. Labib Annafi'",
        "class": "2F"
    },
    {
        "name": "Muhammad Azka Arafat",
        "class": "2F"
    },
    {
        "name": "Muhammad Faris Shidqi",
        "class": "2F"
    },
    {
        "name": "Muhammad Lais Chaniago",
        "class": "2F"
    },
    {
        "name": "Muhammad Meizar Nabiil Asyraf",
        "class": "2F"
    },
    {
        "name": "Muhammad Syam Fatih Ibrahim",
        "class": "2F"
    },
    {
        "name": "Mukhammad Albi Razin Al Fatih",
        "class": "2F"
    },
    {
        "name": "Nizam Mulkilakbar Raushan Fikri",
        "class": "2F"
    },
    {
        "name": "Nuha Rayyan Mazaya",
        "class": "2F"
    },
    {
        "name": "Panji Nugroho Adji",
        "class": "2F"
    },
    {
        "name": "Qautsar Haidzaryan Alyandra",
        "class": "2F"
    },
    {
        "name": "Raditya Nabil Adhyputra",
        "class": "2F"
    },
    {
        "name": "Rafa Atallah Fauzan",
        "class": "2F"
    },
    {
        "name": "Rafa Rajendra Wikrama",
        "class": "2F"
    },
    {
        "name": "Raffa Naufal Azzamy",
        "class": "2F"
    },
    {
        "name": "Zidni Ilhamsyah Putra",
        "class": "2F"
    },
    {
        "name": "Abdan Alimul Fikriy",
        "class": "2G"
    },
    {
        "name": "Abdul Rosyid Fauzan",
        "class": "2G"
    },
    {
        "name": "Ahmad Fitroh Ramadhan",
        "class": "2G"
    },
    {
        "name": "Ghazy Hasbi Nursyifa Rifai",
        "class": "2G"
    },
    {
        "name": "Muhammad Affan Wirasena",
        "class": "2G"
    },
    {
        "name": "Muhammad Naufal Ibrahim Azhar",
        "class": "2G"
    },
    {
        "name": "Nabhan Ammar Fatahillah",
        "class": "2G"
    },
    {
        "name": "Naoko Akbar Adiputra",
        "class": "2G"
    },
    {
        "name": "Naquib Hossein Al-Faruqi",
        "class": "2G"
    },
    {
        "name": "Naraya Jagatsatria",
        "class": "2G"
    },
    {
        "name": "Prabu Mandela Muhammad B",
        "class": "2G"
    },
    {
        "name": "Rafardhan Gavriel Ali Fiandra",
        "class": "2G"
    },
    {
        "name": "Rayhan Ibrahim Pratama Andrianto",
        "class": "2G"
    },
    {
        "name": "Rayyan Hasan Siddiq Sianturi",
        "class": "2G"
    },
    {
        "name": "Rifqi Aufan Al Khairy",
        "class": "2G"
    },
    {
        "name": "Rifqi Nadim Ukail",
        "class": "2G"
    },
    {
        "name": "Riznan Diandra Sulaiman",
        "class": "2G"
    },
    {
        "name": "Royhan Ahmad Farros Alghifari",
        "class": "2G"
    },
    {
        "name": "Satrio Hakim Lazuardi",
        "class": "2G"
    },
    {
        "name": "Seif Al Faqih Avicenna",
        "class": "2G"
    },
    {
        "name": "Sultan Javana Putra Sakti",
        "class": "2G"
    },
    {
        "name": "Tangguh Herry Ramadhan",
        "class": "2G"
    },
    {
        "name": "Tsany Zharif Arkenzio",
        "class": "2G"
    },
    {
        "name": "Ukasyah",
        "class": "2G"
    },
    {
        "name": "Uwais Al Qarni",
        "class": "2G"
    },
    {
        "name": "Vano Alvaro Citrobani",
        "class": "2G"
    },
    {
        "name": "Wafi Ahmad Saelampah",
        "class": "2G"
    },
    {
        "name": "Yaqzan Alfa Tijani",
        "class": "2G"
    },
    {
        "name": "Zufar Azzam Al-Islami",
        "class": "2G"
    },
    {
        "name": "Achmad Azmi As Siddiq",
        "class": "2H"
    },
    {
        "name": "Adha Rais Adli Kasyadi",
        "class": "2H"
    },
    {
        "name": "Ahmadin Nejad Rasman",
        "class": "2H"
    },
    {
        "name": "Ahza Dzaky Al-Fattah",
        "class": "2H"
    },
    {
        "name": "Akhmad Khaizura El Nakhla",
        "class": "2H"
    },
    {
        "name": "Alan Izzatu Fikri",
        "class": "2H"
    },
    {
        "name": "Alvaro Adnan Prasetya",
        "class": "2H"
    },
    {
        "name": "Aufa Kafie El Rafif",
        "class": "2H"
    },
    {
        "name": "Aulia Rafie Juan Putra",
        "class": "2H"
    },
    {
        "name": "Azmi Nurshafi Putra",
        "class": "2H"
    },
    {
        "name": "Dannish Ali Azmi",
        "class": "2H"
    },
    {
        "name": "Deska Ayudya Hardiansyah",
        "class": "2H"
    },
    {
        "name": "Fairuz Razqa El Bahri",
        "class": "2H"
    },
    {
        "name": "Fairuz Tsaqif Izdihar",
        "class": "2H"
    },
    {
        "name": "Fathin Sakha Zidane",
        "class": "2H"
    },
    {
        "name": "Geisan Wibisabdo Shahih",
        "class": "2H"
    },
    {
        "name": "Hibatullah Abdad Labib",
        "class": "2H"
    },
    {
        "name": "Keefy Savero Trizi Manchunia",
        "class": "2H"
    },
    {
        "name": "Kenziero Fawwazzhian Ahmad",
        "class": "2H"
    },
    {
        "name": "Lu'ay Rajendra Yogitaswara",
        "class": "2H"
    },
    {
        "name": "Mirza Anlaqi Janni",
        "class": "2H"
    },
    {
        "name": "Muhammad Abdul Khalid",
        "class": "2H"
    },
    {
        "name": "Muhammad Ahsan Zahirulhaq",
        "class": "2H"
    },
    {
        "name": "Muhammad Arfan Hamizan",
        "class": "2H"
    },
    {
        "name": "Muhammad Balyan Giri Rahatma",
        "class": "2H"
    },
    {
        "name": "Rafandra Ahya Abiyyu",
        "class": "2H"
    },
    {
        "name": "Tsaqif Snow Arrayan",
        "class": "2H"
    },
    {
        "name": "Zain Muhammad Yusuf",
        "class": "2H"
    },
    {
        "name": "Zuhair Azmi Muhammadi",
        "class": "2H"
    },
    {
        "name": "Achmad Abiyyu Nur Afkari",
        "class": "2LOWERA"
    },
    {
        "name": "Adhyastha Faturrahman Al Qarni",
        "class": "2LOWERA"
    },
    {
        "name": "Aruna Hafiz Pranaja",
        "class": "2LOWERA"
    },
    {
        "name": "Aysar Muhammad Casey",
        "class": "2LOWERA"
    },
    {
        "name": "Azzam Aqila Pranaja",
        "class": "2LOWERA"
    },
    {
        "name": "Daffa Al Farizi",
        "class": "2LOWERA"
    },
    {
        "name": "Don Ebiet Prasetyo",
        "class": "2LOWERA"
    },
    {
        "name": "Emir Mahdi Mahdafiqi",
        "class": "2LOWERA"
    },
    {
        "name": "Faaris Abiyyu Indrasetya",
        "class": "2LOWERA"
    },
    {
        "name": "Fath Karim Reifa",
        "class": "2LOWERA"
    },
    {
        "name": "Feroz Zyan Asfamustaqila",
        "class": "2LOWERA"
    },
    {
        "name": "Haleef Dzakyan Ellard",
        "class": "2LOWERA"
    },
    {
        "name": "Izzan Aquila Kusuma",
        "class": "2LOWERA"
    },
    {
        "name": "M. Arique Al Faqih",
        "class": "2LOWERA"
    },
    {
        "name": "Muhammad Azzam Alvaro",
        "class": "2LOWERA"
    },
    {
        "name": "Nadhika Alingga Syeva Ayyubi",
        "class": "2LOWERA"
    },
    {
        "name": "Raffan Azam Alfawwas",
        "class": "2LOWERA"
    },
    {
        "name": "Surya Arga Bintara",
        "class": "2LOWERA"
    },
    {
        "name": "Zada Ibrahim Purwono",
        "class": "2LOWERA"
    },
    {
        "name": "Adhyastha Naufal Tsaqif",
        "class": "2LOWERB"
    },
    {
        "name": "Adiadmaja Haikal Ivantsanayotama",
        "class": "2LOWERB"
    },
    {
        "name": "Ahmad Arsyad Amirudin",
        "class": "2LOWERB"
    },
    {
        "name": "Ahmad Sandya Wilasa",
        "class": "2LOWERB"
    },
    {
        "name": "Ahmad Syarif Maulana",
        "class": "2LOWERB"
    },
    {
        "name": "Aufaa Rakha Abhiprayaananta",
        "class": "2LOWERB"
    },
    {
        "name": "Dzaky Hamizan Tanoyo",
        "class": "2LOWERB"
    },
    {
        "name": "Fatih Arelian Pradana",
        "class": "2LOWERB"
    },
    {
        "name": "Favian Adly Alkhalifi",
        "class": "2LOWERB"
    },
    {
        "name": "Haidar Adha Nuruzzaman",
        "class": "2LOWERB"
    },
    {
        "name": "Ibrahim Tsaqif Rafisqy",
        "class": "2LOWERB"
    },
    {
        "name": "Lakeswara Pandya Nararya Sakha Athallah",
        "class": "2LOWERB"
    },
    {
        "name": "Muhammad Athaya Wafi Al Khalifi",
        "class": "2LOWERB"
    },
    {
        "name": "Muhammad Fattan Rahman",
        "class": "2LOWERB"
    },
    {
        "name": "Muhammad Raihan Muzakki",
        "class": "2LOWERB"
    },
    {
        "name": "Muhammad Zubair Ath-Thufail",
        "class": "2LOWERB"
    },
    {
        "name": "Rafiindra Achmad Rayyan Musafak",
        "class": "2LOWERB"
    },
    {
        "name": "Randhika Hasbi Yusuf",
        "class": "2LOWERB"
    },
    {
        "name": "Safaraz Raqilla Putra",
        "class": "2LOWERB"
    },
    {
        "name": "Satrio Adli Anandito",
        "class": "2LOWERB"
    },
    {
        "name": "Abdullah Azzam Pratama",
        "class": "2LOWERC"
    },
    {
        "name": "Achsan Dirham",
        "class": "2LOWERC"
    },
    {
        "name": "Ahmad Fadlillah Kusuma Alby",
        "class": "2LOWERC"
    },
    {
        "name": "Akhtar Putrama",
        "class": "2LOWERC"
    },
    {
        "name": "Akhtar Rasya Rosadi",
        "class": "2LOWERC"
    },
    {
        "name": "Alby Sakha Rizkadi",
        "class": "2LOWERC"
    },
    {
        "name": "Allyla Niyazla Bani Ibrahim",
        "class": "2LOWERC"
    },
    {
        "name": "Awah Halim Faza",
        "class": "2LOWERC"
    },
    {
        "name": "Danish Iftikhar",
        "class": "2LOWERC"
    },
    {
        "name": "Faqih Hasan Sierin",
        "class": "2LOWERC"
    },
    {
        "name": "Haraka El Muhammady Kusumadiningrat",
        "class": "2LOWERC"
    },
    {
        "name": "Latusina Alpatena",
        "class": "2LOWERC"
    },
    {
        "name": "Lintang Abdullah Abbasy",
        "class": "2LOWERC"
    },
    {
        "name": "Mahdi Muntazhar S. Kau",
        "class": "2LOWERC"
    },
    {
        "name": "Muhammad Adifa Yuda",
        "class": "2LOWERC"
    },
    {
        "name": "Muhammad Arham Habiburrahman",
        "class": "2LOWERC"
    },
    {
        "name": "Muhammad Fahmi",
        "class": "2LOWERC"
    },
    {
        "name": "Qoid Ghurril Muhajjal",
        "class": "2LOWERC"
    },
    {
        "name": "Reyhal Nabil Sunandar",
        "class": "2LOWERC"
    },
    {
        "name": "Abdul Ghani Irfan Rafif",
        "class": "3A"
    },
    {
        "name": "Ahmad Arkan Sya'bani",
        "class": "3A"
    },
    {
        "name": "Ahmad Dahlan Asy'ari",
        "class": "3A"
    },
    {
        "name": "Ahmad Darwis",
        "class": "3A"
    },
    {
        "name": "Ahmad Ghozi El Muntazhor",
        "class": "3A"
    },
    {
        "name": "Aldan 'Izzul Islam",
        "class": "3A"
    },
    {
        "name": "Athallah Azmi Ghaisan Muhammad",
        "class": "3A"
    },
    {
        "name": "Azmi Zulfadli Syafiq",
        "class": "3A"
    },
    {
        "name": "Azri Labibul Khawarizmi",
        "class": "3A"
    },
    {
        "name": "Dzaky Salman Al Farisi",
        "class": "3A"
    },
    {
        "name": "Dzar Al Ghifari",
        "class": "3A"
    },
    {
        "name": "Faiq Fauzil Adhim",
        "class": "3A"
    },
    {
        "name": "Fawwaz Elfareza Zuhri",
        "class": "3A"
    },
    {
        "name": "Gilang Asytar Artyanto",
        "class": "3A"
    },
    {
        "name": "Ibadillah Kaiazmi Mubarak",
        "class": "3A"
    },
    {
        "name": "Kashvi Jabbar Azana",
        "class": "3A"
    },
    {
        "name": "Khawarizmi Fakhrulhaq",
        "class": "3A"
    },
    {
        "name": "M. Fathan Alfarisi Harahap",
        "class": "3A"
    },
    {
        "name": "Muhammad Naufal Alif",
        "class": "3A"
    },
    {
        "name": "Muhammad Aghna Ilman Rafa",
        "class": "3A"
    },
    {
        "name": "Muhammad Arkhan Attaqi",
        "class": "3A"
    },
    {
        "name": "Muhammad Ayyub Al Fatih",
        "class": "3A"
    },
    {
        "name": "Muhammad Gibran Rafassya",
        "class": "3A"
    },
    {
        "name": "Muhammad Mahdi Hanafi",
        "class": "3A"
    },
    {
        "name": "Muzakki Fairuzzaman",
        "class": "3A"
    },
    {
        "name": "Narendra Gerrardi Kusumah",
        "class": "3A"
    },
    {
        "name": "Nawwaf Bahy Rafif",
        "class": "3A"
    },
    {
        "name": "Neymar Tsaqif Hikmatyar",
        "class": "3A"
    },
    {
        "name": "Rijal Abdul'aziz",
        "class": "3A"
    },
    {
        "name": "Royyan Abdurrahman Ibtisam",
        "class": "3A"
    },
    {
        "name": "Sakhi Arkan Elfariza",
        "class": "3A"
    },
    {
        "name": "Umar Ubaidillah Tsaqif",
        "class": "3A"
    },
    {
        "name": "Ahmad Ahsanur Rizqi",
        "class": "3B"
    },
    {
        "name": "Arkana El Sabilly",
        "class": "3B"
    },
    {
        "name": "Athaya Auza'i Mubarak",
        "class": "3B"
    },
    {
        "name": "Dama Arza Evannova",
        "class": "3B"
    },
    {
        "name": "Danar Nizam Daniswara",
        "class": "3B"
    },
    {
        "name": "Devgan Jadid Sahlvatico",
        "class": "3B"
    },
    {
        "name": "Dzaky Anthony Akbar",
        "class": "3B"
    },
    {
        "name": "Fariq Imtiyas Aufaa Kamil",
        "class": "3B"
    },
    {
        "name": "Firaas Izzulhaq",
        "class": "3B"
    },
    {
        "name": "Ganteng Sholih Sugiharto",
        "class": "3B"
    },
    {
        "name": "Gilang Omar Fardad",
        "class": "3B"
    },
    {
        "name": "Jaladri Arif Wirasena",
        "class": "3B"
    },
    {
        "name": "Kemal Mubarak Siregar",
        "class": "3B"
    },
    {
        "name": "Khairil Nizam",
        "class": "3B"
    },
    {
        "name": "Mirza Nasyath Ahza Attaillah",
        "class": "3B"
    },
    {
        "name": "Muhammad Ahsani Taqwim",
        "class": "3B"
    },
    {
        "name": "Muhammad Alvi Mumtaz Brillian Hafizh",
        "class": "3B"
    },
    {
        "name": "Muhammad Daffa Naufal Alaika",
        "class": "3B"
    },
    {
        "name": "Muhammad Farros Linggar Cahyono",
        "class": "3B"
    },
    {
        "name": "Muhammad Fathir Alfalah",
        "class": "3B"
    },
    {
        "name": "Muhammad Mahdi Hafidz",
        "class": "3B"
    },
    {
        "name": "Muhammad Muhdi Hafidz",
        "class": "3B"
    },
    {
        "name": "Nahsif Ilman Hazim Purwono",
        "class": "3B"
    },
    {
        "name": "Narendra Wibawa",
        "class": "3B"
    },
    {
        "name": "Naufal Zhafran Purnama",
        "class": "3B"
    },
    {
        "name": "Rifqi Maliki",
        "class": "3B"
    },
    {
        "name": "Rizki Chandra Dewantara",
        "class": "3B"
    },
    {
        "name": "Rizqi Satria Putra Surya",
        "class": "3B"
    },
    {
        "name": "Yasykur Slamet 'Abqariy",
        "class": "3B"
    },
    {
        "name": "Zhafran Dhiaurrahman Hakim",
        "class": "3B"
    },
    {
        "name": "Adelio Daffa Syahrizha",
        "class": "3C"
    },
    {
        "name": "Ahmad Miqdad",
        "class": "3C"
    },
    {
        "name": "Alano Faaiq Alfeno",
        "class": "3C"
    },
    {
        "name": "Arfandhika Fakhrul Islam",
        "class": "3C"
    },
    {
        "name": "Aydin Rafif",
        "class": "3C"
    },
    {
        "name": "Danish Alzahid Dinasti",
        "class": "3C"
    },
    {
        "name": "Ghani Arif Witjaksono",
        "class": "3C"
    },
    {
        "name": "Haidarrafid Satria Ardhana",
        "class": "3C"
    },
    {
        "name": "Halvens Asgafo Mohamad Ilfa Baraka",
        "class": "3C"
    },
    {
        "name": "Iqbal Zulfikar Al Hanif",
        "class": "3C"
    },
    {
        "name": "Jangky Dausat",
        "class": "3C"
    },
    {
        "name": "Kumara Banyu Argani",
        "class": "3C"
    },
    {
        "name": "Mekha Ilham Lutfianto",
        "class": "3C"
    },
    {
        "name": "Muhammad Aiman Naim",
        "class": "3C"
    },
    {
        "name": "Muhammad Dede Afkar",
        "class": "3C"
    },
    {
        "name": "Muhammad Karel Ashiddiq",
        "class": "3C"
    },
    {
        "name": "Muhammad Naufal Rasyid Arafi",
        "class": "3C"
    },
    {
        "name": "Naufal Fahmi Darsono",
        "class": "3C"
    },
    {
        "name": "Nazhif Fahreza Zuhairy",
        "class": "3C"
    },
    {
        "name": "Nizar Adhyatma Aryanda",
        "class": "3C"
    },
    {
        "name": "Rafa Agitananda Az Zayyan",
        "class": "3C"
    },
    {
        "name": "Rafa Faeyza Fa'iz",
        "class": "3C"
    },
    {
        "name": "Raihan Fatih",
        "class": "3C"
    },
    {
        "name": "Rais Abqari Ash Shidqi",
        "class": "3C"
    },
    {
        "name": "Rayyan Nafiz Ananta",
        "class": "3C"
    },
    {
        "name": "Reyhan Mohammad Kenzie",
        "class": "3C"
    },
    {
        "name": "Satriya Alvaro Putra",
        "class": "3C"
    },
    {
        "name": "Wildan Faiz Mahendra",
        "class": "3C"
    },
    {
        "name": "William Ramadhan Al Ghazali",
        "class": "3C"
    },
    {
        "name": "Zia El Ibrahim Aqeela Putra Wijaya",
        "class": "3C"
    },
    {
        "name": "Abid Fadhil Prasraya",
        "class": "3D"
    },
    {
        "name": "Aditya Siddiq Ismoyo",
        "class": "3D"
    },
    {
        "name": "Adyatma Abdi Danendra",
        "class": "3D"
    },
    {
        "name": "Akram Saifuddin",
        "class": "3D"
    },
    {
        "name": "Athala Maulana Syarief",
        "class": "3D"
    },
    {
        "name": "Avicena Nafa Ghasani",
        "class": "3D"
    },
    {
        "name": "Benhati Damaifajar Hayumarghi",
        "class": "3D"
    },
    {
        "name": "Dhiyauddin Hanif Al Awwab",
        "class": "3D"
    },
    {
        "name": "Dyandra Fajri Putra Ramadhan",
        "class": "3D"
    },
    {
        "name": "El Faza Miracle Akram",
        "class": "3D"
    },
    {
        "name": "Fairuz Azzam Mahfuzh",
        "class": "3D"
    },
    {
        "name": "Fajar Cahya Rabbani",
        "class": "3D"
    },
    {
        "name": "Fauzil Habibi Irawan",
        "class": "3D"
    },
    {
        "name": "Furqon Ardhan Muthohar Rakasiwi",
        "class": "3D"
    },
    {
        "name": "Gagas Revolusi Bangsa",
        "class": "3D"
    },
    {
        "name": "Ikhwan Labib Rozaqi",
        "class": "3D"
    },
    {
        "name": "Kindi Abdullah Maulana",
        "class": "3D"
    },
    {
        "name": "Mahardika Panji Wardhana",
        "class": "3D"
    },
    {
        "name": "Mawla Azmat Khan Al-Husayni",
        "class": "3D"
    },
    {
        "name": "Muhammad Alif Al-Fatih",
        "class": "3D"
    },
    {
        "name": "Muhammad Farros Prasetyaning Pribadi",
        "class": "3D"
    },
    {
        "name": "Muhammad Herdiansyah Al Faqih",
        "class": "3D"
    },
    {
        "name": "Muhammad Tsabit Arrafat",
        "class": "3D"
    },
    {
        "name": "Nabil Ahmad Bashori",
        "class": "3D"
    },
    {
        "name": "Nirio Nur Firdausiy Ahla",
        "class": "3D"
    },
    {
        "name": "Novda Dama Santosa",
        "class": "3D"
    },
    {
        "name": "Oktaviano Aji Bagaskara",
        "class": "3D"
    },
    {
        "name": "Pandu Arya Al-Ghifari",
        "class": "3D"
    },
    {
        "name": "Rizqi Ahmad Altaf Zafar",
        "class": "3D"
    },
    {
        "name": "Achmad Adi Darwis Elfaza",
        "class": "3E"
    },
    {
        "name": "Alfarizqi Zaidan Nugroho",
        "class": "3E"
    },
    {
        "name": "Alfian Atha Ramadhan",
        "class": "3E"
    },
    {
        "name": "Alizufar Raffasya Sukriyana",
        "class": "3E"
    },
    {
        "name": "Arkan Fawazzi Kesturi",
        "class": "3E"
    },
    {
        "name": "Arsya Navarelo Al Islam",
        "class": "3E"
    },
    {
        "name": "Ausath Amna",
        "class": "3E"
    },
    {
        "name": "Azzam Amirudin Syamil",
        "class": "3E"
    },
    {
        "name": "Danish Asshidiqie Pribadi",
        "class": "3E"
    },
    {
        "name": "Dhika Muldan Mustari",
        "class": "3E"
    },
    {
        "name": "Galang Afkar Artyanto",
        "class": "3E"
    },
    {
        "name": "Jawdan Hafidz Mumtazan",
        "class": "3E"
    },
    {
        "name": "Juhdan Yusuf Ghaisan",
        "class": "3E"
    },
    {
        "name": "Kayyis Hazim",
        "class": "3E"
    },
    {
        "name": "Kim Kayana Omar Naveed",
        "class": "3E"
    },
    {
        "name": "Maulana Yusuf Akbar Nuraga",
        "class": "3E"
    },
    {
        "name": "Muadz Zidan Rahman",
        "class": "3E"
    },
    {
        "name": "Muhamad Athoya Zain",
        "class": "3E"
    },
    {
        "name": "Muhammad Faiz Ibnu Zakaria",
        "class": "3E"
    },
    {
        "name": "Muhammad Iqbal Sheehan Azizy",
        "class": "3E"
    },
    {
        "name": "Muhammad Kholil Abdurohman",
        "class": "3E"
    },
    {
        "name": "Muhammad Rauf Janitra Handoko",
        "class": "3E"
    },
    {
        "name": "Muhammad Sakhi Choirul Fata",
        "class": "3E"
    },
    {
        "name": "Muhammad Vano Al Tsaqib",
        "class": "3E"
    },
    {
        "name": "Naazira Parsa",
        "class": "3E"
    },
    {
        "name": "Rafi Ahnaf Juffri",
        "class": "3E"
    },
    {
        "name": "Ranu Biruni",
        "class": "3E"
    },
    {
        "name": "Rois Faraz Hanafie Triyono",
        "class": "3E"
    },
    {
        "name": "Zabran Muhammad Athif",
        "class": "3E"
    },
    {
        "name": "Aftah Munsyi' Alfikra",
        "class": "3F"
    },
    {
        "name": "Ahmad Daffa Fahri Al Farabi",
        "class": "3F"
    },
    {
        "name": "Ahmad Dahlan Harahap",
        "class": "3F"
    },
    {
        "name": "Ahmad Mekail Zabriski",
        "class": "3F"
    },
    {
        "name": "Althaf Dinajed Rafsanjani",
        "class": "3F"
    },
    {
        "name": "Athallah Faris Kudus",
        "class": "3F"
    },
    {
        "name": "Azka Maydan",
        "class": "3F"
    },
    {
        "name": "Bahtiar Abid Sakhi",
        "class": "3F"
    },
    {
        "name": "Danendra Izzat Arfian",
        "class": "3F"
    },
    {
        "name": "Emilio Valdano Danadyaksa",
        "class": "3F"
    },
    {
        "name": "Evrizal Fasich Ilmi",
        "class": "3F"
    },
    {
        "name": "Faiz Azkan Niyafi",
        "class": "3F"
    },
    {
        "name": "Fasta Nirunabi Satriani Hadi Wijaya",
        "class": "3F"
    },
    {
        "name": "Haidar Ali Mursyid",
        "class": "3F"
    },
    {
        "name": "Karel Kavindra Agastya Putra Pradipta",
        "class": "3F"
    },
    {
        "name": "Kumara Argani Azfar Husna",
        "class": "3F"
    },
    {
        "name": "Mahardika Prabhu Nusantara Pri Atmaji",
        "class": "3F"
    },
    {
        "name": "Muhammad Ihsan Faza",
        "class": "3F"
    },
    {
        "name": "Muhammad Najib",
        "class": "3F"
    },
    {
        "name": "Muhammad Raesa Fathan",
        "class": "3F"
    },
    {
        "name": "Muhammad Syafiiq Azmi",
        "class": "3F"
    },
    {
        "name": "Muhammad Zhafran Al Farisi",
        "class": "3F"
    },
    {
        "name": "Muzaffar Al Qashid",
        "class": "3F"
    },
    {
        "name": "Prabu Yustisio Hakim Arisda",
        "class": "3F"
    },
    {
        "name": "R. Fahri Evano Isya Kholik",
        "class": "3F"
    },
    {
        "name": "Radhi Ghiyast Mumtaz",
        "class": "3F"
    },
    {
        "name": "Rashya Hafiz Fadian",
        "class": "3F"
    },
    {
        "name": "Senggang Cakradara Rizky",
        "class": "3F"
    },
    {
        "name": "Vino Sebastian Adam",
        "class": "3F"
    },
    {
        "name": "Abrisam Janitra Abimanyu",
        "class": "3G"
    },
    {
        "name": "Adlan Muhammad Askari Arfa",
        "class": "3G"
    },
    {
        "name": "Arfan Satria Pratama",
        "class": "3G"
    },
    {
        "name": "Arzaki Azhar Nipdapratama",
        "class": "3G"
    },
    {
        "name": "Assalum Dana Al Ukhra",
        "class": "3G"
    },
    {
        "name": "Athallah Izzat Rian Rasyaf Resyaban",
        "class": "3G"
    },
    {
        "name": "Ciptaning Radito",
        "class": "3G"
    },
    {
        "name": "Daffa Dzakka Al Ghani",
        "class": "3G"
    },
    {
        "name": "Dzaky Ammar Murad",
        "class": "3G"
    },
    {
        "name": "Dzikri Fadillah Akbar",
        "class": "3G"
    },
    {
        "name": "Edgar Atharizz Narottama Indrahayu",
        "class": "3G"
    },
    {
        "name": "Faheem Muhammad Akhtar",
        "class": "3G"
    },
    {
        "name": "Irawan Atmojo Wibowo",
        "class": "3G"
    },
    {
        "name": "Januar Putra Wijaya",
        "class": "3G"
    },
    {
        "name": "Junnah Roghib Arroyyan Shopuanudin",
        "class": "3G"
    },
    {
        "name": "Leonard Fathaan Abqary Amrudin",
        "class": "3G"
    },
    {
        "name": "Mirza Ahza Rais",
        "class": "3G"
    },
    {
        "name": "Muhammad Alzamsyah Putra",
        "class": "3G"
    },
    {
        "name": "Muhammad Arrayan Edgar Alvaro",
        "class": "3G"
    },
    {
        "name": "Muhammad Ilyas Al-Farizi",
        "class": "3G"
    },
    {
        "name": "Muhammad Naufal Alfaris",
        "class": "3G"
    },
    {
        "name": "Muhammad Raihan Fakhri",
        "class": "3G"
    },
    {
        "name": "Muhammad Rizky Wijaya",
        "class": "3G"
    },
    {
        "name": "Muhammad Satria Ramadhan",
        "class": "3G"
    },
    {
        "name": "Muwafaqi Amru Ahmad",
        "class": "3G"
    },
    {
        "name": "Nabihan Sakhi Zaidan",
        "class": "3G"
    },
    {
        "name": "Radith Putra Andita",
        "class": "3G"
    },
    {
        "name": "Rasya Muhammad Athaya Ardiansyah",
        "class": "3G"
    },
    {
        "name": "Umar Muhtar",
        "class": "3G"
    },
    {
        "name": "Zidniy Nuril Haq",
        "class": "3G"
    },
    {
        "name": "Abid Fadhil Abyah",
        "class": "3H"
    },
    {
        "name": "Abieyacssa Ayubie Sunbastian",
        "class": "3H"
    },
    {
        "name": "Achmad Hanif Al Faris",
        "class": "3H"
    },
    {
        "name": "Afif Akhsanul Muttaqin",
        "class": "3H"
    },
    {
        "name": "Ahnaf Hilmi Fahreza",
        "class": "3H"
    },
    {
        "name": "Alfian Raffly Darmawan",
        "class": "3H"
    },
    {
        "name": "Azka Rafisqy Faeyza",
        "class": "3H"
    },
    {
        "name": "Azzam Fakhriza Ilmi",
        "class": "3H"
    },
    {
        "name": "Basyarajad Zayyan",
        "class": "3H"
    },
    {
        "name": "Devin Agathon Muhammad Abnar Rajendra",
        "class": "3H"
    },
    {
        "name": "Dzaky Abbasy Ghaisan",
        "class": "3H"
    },
    {
        "name": "Fadhil Atha Maulana",
        "class": "3H"
    },
    {
        "name": "Fadil Abdul Natsir",
        "class": "3H"
    },
    {
        "name": "Fatihan Al Ghifari RA",
        "class": "3H"
    },
    {
        "name": "Fauzan Wildan Al-Insan",
        "class": "3H"
    },
    {
        "name": "Hideaki Akhtar Yusuf",
        "class": "3H"
    },
    {
        "name": "Hisyam Nabil Pasha",
        "class": "3H"
    },
    {
        "name": "Mahesa Arundaya Al-Abrar",
        "class": "3H"
    },
    {
        "name": "Muhammad Aziz Al Fatih Siregar",
        "class": "3H"
    },
    {
        "name": "Muhammad Daffa Frananda Al Hafidz",
        "class": "3H"
    },
    {
        "name": "Muhammad Hayfa Reza",
        "class": "3H"
    },
    {
        "name": "Muhammad Jiddan Irfansyah",
        "class": "3H"
    },
    {
        "name": "Muhammad Syafiq Yaqdhan",
        "class": "3H"
    },
    {
        "name": "Muhammad Zain Khan Abidin",
        "class": "3H"
    },
    {
        "name": "Nabil Hanafi Amarray",
        "class": "3H"
    },
    {
        "name": "Nadif Adicandra",
        "class": "3H"
    },
    {
        "name": "Ramadhan Dafa Rusydi",
        "class": "3H"
    },
    {
        "name": "Rizqy Fathu Ramadhan",
        "class": "3H"
    },
    {
        "name": "Zavier Alvaro",
        "class": "3H"
    },
    {
        "name": "Achmad Faiz Khoiruddin",
        "class": "3UPPERA"
    },
    {
        "name": "Ahmad Alfathir Jamaluddin Tsani",
        "class": "3UPPERA"
    },
    {
        "name": "Akhdan Finley Brisbantyo",
        "class": "3UPPERA"
    },
    {
        "name": "Ammar Fakhri Mubarok",
        "class": "3UPPERA"
    },
    {
        "name": "Avatara Hussein Gwee",
        "class": "3UPPERA"
    },
    {
        "name": "Bilfaqih Rei Alteza Fata",
        "class": "3UPPERA"
    },
    {
        "name": "Darrel Athaya Zarkasyi",
        "class": "3UPPERA"
    },
    {
        "name": "Fakhri Dzaky Nurrochim",
        "class": "3UPPERA"
    },
    {
        "name": "Hafy Nawab Ahnaf",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Dastan Abdurrahman Naufal",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Fadhli Albani",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Hanan Pramana",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Nur Fauzul Kabir",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Raffa Rafisky",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Rizky Pratama",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Rizky Wira Muazzam",
        "class": "3UPPERA"
    },
    {
        "name": "Muhammad Shafy Hasan",
        "class": "3UPPERA"
    },
    {
        "name": "Radit Pinuji",
        "class": "3UPPERA"
    },
    {
        "name": "Safa Haedar Adiredjo",
        "class": "3UPPERA"
    },
    {
        "name": "Shankarajiva Aladdina Muhammad Harun",
        "class": "3UPPERA"
    },
    {
        "name": "Sulthan Al-abqary Saputra",
        "class": "3UPPERA"
    },
    {
        "name": "Zuhudi Fahman Nabiha",
        "class": "3UPPERA"
    },
    {
        "name": "Achmad Fauzan Naufal",
        "class": "3UPPERB"
    },
    {
        "name": "Alif Ikram Habibi",
        "class": "3UPPERB"
    },
    {
        "name": "Arung Hideyoshi Perdana",
        "class": "3UPPERB"
    },
    {
        "name": "Atha Ahza",
        "class": "3UPPERB"
    },
    {
        "name": "Azka Aqila Nugraha",
        "class": "3UPPERB"
    },
    {
        "name": "Bagas Bhadrika Arsa Seno",
        "class": "3UPPERB"
    },
    {
        "name": "Faeyza El Rafif Ramadhan",
        "class": "3UPPERB"
    },
    {
        "name": "Fakhri Maulana Sagoro",
        "class": "3UPPERB"
    },
    {
        "name": "Fatih Daffa Wiraatmaja Saputra",
        "class": "3UPPERB"
    },
    {
        "name": "Fatih Rizki Iw",
        "class": "3UPPERB"
    },
    {
        "name": "Firas Faiq Rahmadian",
        "class": "3UPPERB"
    },
    {
        "name": "Hasan Kamaludin Madani",
        "class": "3UPPERB"
    },
    {
        "name": "Mohammad Reihan Abdillah",
        "class": "3UPPERB"
    },
    {
        "name": "Muhammad Althaf Ghifari",
        "class": "3UPPERB"
    },
    {
        "name": "Muhammad Rayyan Atharizz Yufa",
        "class": "3UPPERB"
    },
    {
        "name": "Muhammad Zhafif Alkhoiri",
        "class": "3UPPERB"
    },
    {
        "name": "Murtadha Tangguh Al-Fatih Fauzi",
        "class": "3UPPERB"
    },
    {
        "name": "Nabatan Akbar Farkan",
        "class": "3UPPERB"
    },
    {
        "name": "Najmi Asfar",
        "class": "3UPPERB"
    },
    {
        "name": "Nevan Ammar Gavrila",
        "class": "3UPPERB"
    },
    {
        "name": "Rakha Mahardhika",
        "class": "3UPPERB"
    },
    {
        "name": "Rakha Zubaidi Rama",
        "class": "3UPPERB"
    },
    {
        "name": "Achmad Yusuf Alhamdhani",
        "class": "4A"
    },
    {
        "name": "Ainurrofiq Syamsudin",
        "class": "4A"
    },
    {
        "name": "Elka Maulana Iskandar",
        "class": "4A"
    },
    {
        "name": "Fadhil Okta Pramana",
        "class": "4A"
    },
    {
        "name": "Fahma Akhsananda Hidayat",
        "class": "4A"
    },
    {
        "name": "Feris Lutfi Hilal Mahadi",
        "class": "4A"
    },
    {
        "name": "Firaz Tsaqeffano",
        "class": "4A"
    },
    {
        "name": "Fuad Imtiyaz Mubarok",
        "class": "4A"
    },
    {
        "name": "Habiburrahman Al Azizi",
        "class": "4A"
    },
    {
        "name": "Hail Kaisan Izzati",
        "class": "4A"
    },
    {
        "name": "Haiz Elhaq Rahman",
        "class": "4A"
    },
    {
        "name": "Hamzah Fatih Almubarok",
        "class": "4A"
    },
    {
        "name": "Kiano Arshad Wicaksono",
        "class": "4A"
    },
    {
        "name": "M.Dafa Wafiqul Azhar",
        "class": "4A"
    },
    {
        "name": "Mohammad Favian Prasetyo",
        "class": "4A"
    },
    {
        "name": "Muhamad Azriel Akbar Setya Putra",
        "class": "4A"
    },
    {
        "name": "Muhammad Abid Al Dzaka",
        "class": "4A"
    },
    {
        "name": "Muhammad Almairi Akhyar",
        "class": "4A"
    },
    {
        "name": "Muhammad Burhanuddin Robbani",
        "class": "4A"
    },
    {
        "name": "Muhammad Dwilutfan Ahda",
        "class": "4A"
    },
    {
        "name": "Muhammad Hafiz Firdaus",
        "class": "4A"
    },
    {
        "name": "Muhammad Hilmi Siregar",
        "class": "4A"
    },
    {
        "name": "Muhammad Ibra Bekti Rohmadhoni",
        "class": "4A"
    },
    {
        "name": "Muhammad Naufal Rasyiid Jaya",
        "class": "4A"
    },
    {
        "name": "Muhammad Rafa Arrayyan",
        "class": "4A"
    },
    {
        "name": "Muhammad Razan Al Azka Panglimunan",
        "class": "4A"
    },
    {
        "name": "Nizham Ziyad Ar Rasyiediin",
        "class": "4A"
    },
    {
        "name": "Rohman Qolbi Salim",
        "class": "4A"
    },
    {
        "name": "Syabil Angkasa Putra Solissa",
        "class": "4A"
    },
    {
        "name": "Wazni Nawaf Al-Farras",
        "class": "4A"
    },
    {
        "name": "Yusuf Aydin Hylmi Asadel",
        "class": "4A"
    },
    {
        "name": "Ahmad Azzam Huluq",
        "class": "4B"
    },
    {
        "name": "Ahmad Faith Aly Ishar",
        "class": "4B"
    },
    {
        "name": "Ahmad Syamil Zakaria",
        "class": "4B"
    },
    {
        "name": "Amar Maulana Ardani",
        "class": "4B"
    },
    {
        "name": "Amaru Dimitar Seja Maharota",
        "class": "4B"
    },
    {
        "name": "Arman Maulana",
        "class": "4B"
    },
    {
        "name": "Ashraf 'Ifathurrosydan",
        "class": "4B"
    },
    {
        "name": "Aviciena Rafa Al Ghifari",
        "class": "4B"
    },
    {
        "name": "Azharuddin Ahza Aprilian",
        "class": "4B"
    },
    {
        "name": "Gardadin Rusydian Muhammad",
        "class": "4B"
    },
    {
        "name": "Gilang Cahyo Candrawimba",
        "class": "4B"
    },
    {
        "name": "Haidar Iftikarullah Aszuhdi",
        "class": "4B"
    },
    {
        "name": "Hanan Al Atsari",
        "class": "4B"
    },
    {
        "name": "Hisyam Arrosyid",
        "class": "4B"
    },
    {
        "name": "Kalam Abimanyu Priyatna",
        "class": "4B"
    },
    {
        "name": "Kanka Emiliano Al Arafat",
        "class": "4B"
    },
    {
        "name": "Kashka Fathan Magani",
        "class": "4B"
    },
    {
        "name": "Kevin Zahran Firdaus",
        "class": "4B"
    },
    {
        "name": "Lukman Husain Assalim",
        "class": "4B"
    },
    {
        "name": "M. Yusuf Zhafran Islami",
        "class": "4B"
    },
    {
        "name": "Mohammad Ihsan Kamil",
        "class": "4B"
    },
    {
        "name": "Muhamad Abdurrahman Tsaqif",
        "class": "4B"
    },
    {
        "name": "Muhammad Dhabit Azka",
        "class": "4B"
    },
    {
        "name": "Muhammad Dzaki Rian Putra",
        "class": "4B"
    },
    {
        "name": "Muhammad Fakhri Akbar Sasongko",
        "class": "4B"
    },
    {
        "name": "Muhammad Farhan Habibie",
        "class": "4B"
    },
    {
        "name": "Muhammad Hafiz Ziyad",
        "class": "4B"
    },
    {
        "name": "Muhammad Syauqi Ulin Nuha",
        "class": "4B"
    },
    {
        "name": "Noersy Arkana Mahammada",
        "class": "4B"
    },
    {
        "name": "Yudha Rasyid Aulia",
        "class": "4B"
    },
    {
        "name": "Yusuf Fachrizal Haris",
        "class": "4B"
    },
    {
        "name": "Abdurrahman Taqiy",
        "class": "4C"
    },
    {
        "name": "Achmad Muhajir Dzul Jalali",
        "class": "4C"
    },
    {
        "name": "Ajnata Haziq Abisatya Hayu Wardana",
        "class": "4C"
    },
    {
        "name": "Azka Syamil Fasya",
        "class": "4C"
    },
    {
        "name": "Bilal Jibril",
        "class": "4C"
    },
    {
        "name": "Bintang Revoluna Al Mahdi",
        "class": "4C"
    },
    {
        "name": "Devga Aulia",
        "class": "4C"
    },
    {
        "name": "Farzan Naufal Hakam",
        "class": "4C"
    },
    {
        "name": "Favian Raditya Muhammad",
        "class": "4C"
    },
    {
        "name": "Hasbi Arfan Nicho Al Farisi",
        "class": "4C"
    },
    {
        "name": "Jibran Arga Hendraputra",
        "class": "4C"
    },
    {
        "name": "Maulana Yusuf Raka Syahputra",
        "class": "4C"
    },
    {
        "name": "Muhammad Alfan Arrasyid",
        "class": "4C"
    },
    {
        "name": "Muhammad Arfa Bastari",
        "class": "4C"
    },
    {
        "name": "Muhammad Atha Elhanani",
        "class": "4C"
    },
    {
        "name": "Muhammad Azka Alvazio",
        "class": "4C"
    },
    {
        "name": "Muhammad Fadhil Dzakwan",
        "class": "4C"
    },
    {
        "name": "Muhammad Fakhri Ahnaf",
        "class": "4C"
    },
    {
        "name": "Muhammad Farhan Al Arsyad",
        "class": "4C"
    },
    {
        "name": "Muhammad Haidzar Qudwa",
        "class": "4C"
    },
    {
        "name": "Muhammad Haydar Arief",
        "class": "4C"
    },
    {
        "name": "Muhammad Kafi",
        "class": "4C"
    },
    {
        "name": "Muhammad Luthfi Akmal",
        "class": "4C"
    },
    {
        "name": "Randi Fatih Elfarezi",
        "class": "4C"
    },
    {
        "name": "Rangga Putra Atmaji",
        "class": "4C"
    },
    {
        "name": "Rizqi Adhitia Rahman",
        "class": "4C"
    },
    {
        "name": "Rizqi Syifa Al Furqon",
        "class": "4C"
    },
    {
        "name": "Tegar Yudha Satria Pratama",
        "class": "4C"
    },
    {
        "name": "Zakiy Mustofa",
        "class": "4C"
    },
    {
        "name": "Zufar Farros Susilo Prabowo",
        "class": "4C"
    },
    {
        "name": "Abimanyu Aryo Atmojo Negoro",
        "class": "4D"
    },
    {
        "name": "Akhsan Mumtazurachman",
        "class": "4D"
    },
    {
        "name": "Arkan Araafi Ardian",
        "class": "4D"
    },
    {
        "name": "Arkan Saefulhaq Arasy",
        "class": "4D"
    },
    {
        "name": "Auddie Arjuna Rahardjo",
        "class": "4D"
    },
    {
        "name": "Azzamy Syauqi",
        "class": "4D"
    },
    {
        "name": "Devarka Fatih Rahman",
        "class": "4D"
    },
    {
        "name": "Dimas Khairul Rahman",
        "class": "4D"
    },
    {
        "name": "Dimas Nur Sayyid",
        "class": "4D"
    },
    {
        "name": "Faith Arkan Adinata",
        "class": "4D"
    },
    {
        "name": "Fawwaz Alvaro Putra Ashita",
        "class": "4D"
    },
    {
        "name": "Habib Raikhan Firdaus",
        "class": "4D"
    },
    {
        "name": "Haikal Mirza Pastika",
        "class": "4D"
    },
    {
        "name": "Januar Fahmi Aribawa",
        "class": "4D"
    },
    {
        "name": "M. Abyan Qisthi Nabhani",
        "class": "4D"
    },
    {
        "name": "Miko Samudra Asmaradinata",
        "class": "4D"
    },
    {
        "name": "Mohammad Azzam Azinuddin",
        "class": "4D"
    },
    {
        "name": "Muhammad Affan Rikza Falafi",
        "class": "4D"
    },
    {
        "name": "Muhammad Aqeela Farizky",
        "class": "4D"
    },
    {
        "name": "Muhammad Fairuzzada Alfarisi",
        "class": "4D"
    },
    {
        "name": "Muhammad Muhibban",
        "class": "4D"
    },
    {
        "name": "Muhammad Rafa Firdaus",
        "class": "4D"
    },
    {
        "name": "Muhammad Rafi Setiawan",
        "class": "4D"
    },
    {
        "name": "Muhammad Tsaqiif Faidh Abdillah",
        "class": "4D"
    },
    {
        "name": "Raden Hafi Muhadzdzib Hassan",
        "class": "4D"
    },
    {
        "name": "Rafardhan Nizam Illiyansyah",
        "class": "4D"
    },
    {
        "name": "Raffasya Syaqif Alfaridzi",
        "class": "4D"
    },
    {
        "name": "Raja Muda Athallah Handriawan",
        "class": "4D"
    },
    {
        "name": "Rayyan Al Ghaffar",
        "class": "4D"
    },
    {
        "name": "Sajidan Yazid",
        "class": "4D"
    },
    {
        "name": "Sayeed Muhammad Rizvi",
        "class": "4D"
    },
    {
        "name": "Abdullah Fathin Sa'dan",
        "class": "4E"
    },
    {
        "name": "Abdullah Khairul Iqbal",
        "class": "4E"
    },
    {
        "name": "Aden Bagas Adiputra",
        "class": "4E"
    },
    {
        "name": "Aulia Fadhil Anwar",
        "class": "4E"
    },
    {
        "name": "Aysar Sahwahita Darwisyi",
        "class": "4E"
    },
    {
        "name": "Aza Kahfi Najiy",
        "class": "4E"
    },
    {
        "name": "Dwi Rizky Fausta",
        "class": "4E"
    },
    {
        "name": "Fakhri Akbar Ahsan Nabil",
        "class": "4E"
    },
    {
        "name": "Gyan Fasya Ananda Vardan",
        "class": "4E"
    },
    {
        "name": "Hafy Waskitha Dirja",
        "class": "4E"
    },
    {
        "name": "Haidhar Dhiyaurrahman Abassy",
        "class": "4E"
    },
    {
        "name": "Ibrahim Raihan Rabbani",
        "class": "4E"
    },
    {
        "name": "Kafaa Na'im Hasany",
        "class": "4E"
    },
    {
        "name": "Khaizuran Ahza Putra Firma",
        "class": "4E"
    },
    {
        "name": "Liandra Rifky Al- Baihaqi",
        "class": "4E"
    },
    {
        "name": "Mirza Ghaisan Ramadhan",
        "class": "4E"
    },
    {
        "name": "Muhammad Abid Hibban Prabaswara",
        "class": "4E"
    },
    {
        "name": "Muhammad Alwan Dzakwan Al Afiq",
        "class": "4E"
    },
    {
        "name": "Muhammad Nabil Zakwan Wicaksono",
        "class": "4E"
    },
    {
        "name": "Muhammad Rauuf Arshidiq",
        "class": "4E"
    },
    {
        "name": "Muhammad Rifqi Alfayyadh",
        "class": "4E"
    },
    {
        "name": "Muhammad Zaim Aditya",
        "class": "4E"
    },
    {
        "name": "Muhammad Zuhdi Fathir Rahman",
        "class": "4E"
    },
    {
        "name": "Naufal Mu'adz Afandi",
        "class": "4E"
    },
    {
        "name": "Nino Nabkhan Nabawi",
        "class": "4E"
    },
    {
        "name": "Raditya Aris Nararya Syachruddin",
        "class": "4E"
    },
    {
        "name": "Rafa Ilyas Syahputra",
        "class": "4E"
    },
    {
        "name": "Riziawan Iman Putranto",
        "class": "4E"
    },
    {
        "name": "Syauqie Isham Tsany",
        "class": "4E"
    },
    {
        "name": "A Khoirul Akbar",
        "class": "4F"
    },
    {
        "name": "Abyaz Dhamien",
        "class": "4F"
    },
    {
        "name": "Ahmad Ismail Labib",
        "class": "4F"
    },
    {
        "name": "Angger Dawud Ziyadatul Khoir",
        "class": "4F"
    },
    {
        "name": "Asfa Nafis Rafandra",
        "class": "4F"
    },
    {
        "name": "Byan Sabilli Firdaus",
        "class": "4F"
    },
    {
        "name": "Daffa Ahmad Hanif",
        "class": "4F"
    },
    {
        "name": "Fabiansyah Jumany Rizki",
        "class": "4F"
    },
    {
        "name": "Fathi Shafwan Arrayan Lutfi",
        "class": "4F"
    },
    {
        "name": "Hafi Abidin Ismail",
        "class": "4F"
    },
    {
        "name": "M. Fajar Ramadhan",
        "class": "4F"
    },
    {
        "name": "Maheswara Asiandaru",
        "class": "4F"
    },
    {
        "name": "Muhammad Al Fatih Harin",
        "class": "4F"
    },
    {
        "name": "Muhammad Alfarezel Mediyanto",
        "class": "4F"
    },
    {
        "name": "Muhammad Atha Ta'jul Ulya",
        "class": "4F"
    },
    {
        "name": "Muhammad Fawwas Zhafran Athallah",
        "class": "4F"
    },
    {
        "name": "Muhammad Nizzam Hakimi",
        "class": "4F"
    },
    {
        "name": "Muhammad Radif Al Haq",
        "class": "4F"
    },
    {
        "name": "Muhammad Yunus Firdaus",
        "class": "4F"
    },
    {
        "name": "Muhammad Za'im El Fathir",
        "class": "4F"
    },
    {
        "name": "Nizam Ahza Billah",
        "class": "4F"
    },
    {
        "name": "Noon Fathan",
        "class": "4F"
    },
    {
        "name": "Radithya Adinata",
        "class": "4F"
    },
    {
        "name": "Rahmatul Wahid Nandipinto",
        "class": "4F"
    },
    {
        "name": "Safaras Akma Fadhil",
        "class": "4F"
    },
    {
        "name": "Sora Ahnaf Alkautsar",
        "class": "4F"
    },
    {
        "name": "Syahru Rama Septyan",
        "class": "4F"
    },
    {
        "name": "Yusuf Bagas Putranto",
        "class": "4F"
    },
    {
        "name": "Zahran Shadr Malika Hakim",
        "class": "4F"
    },
    {
        "name": "Ahmad Adzikiya",
        "class": "4UPPERA"
    },
    {
        "name": "Ghazwan Faadhil Ahmad",
        "class": "4UPPERA"
    },
    {
        "name": "Iman Nur Hakim",
        "class": "4UPPERA"
    },
    {
        "name": "Jibril Alfath Fadrian",
        "class": "4UPPERA"
    },
    {
        "name": "Joe Salim Angli",
        "class": "4UPPERA"
    },
    {
        "name": "Kanzul Firdausi",
        "class": "4UPPERA"
    },
    {
        "name": "Kenji Arkan Al Ghozi",
        "class": "4UPPERA"
    },
    {
        "name": "Mahardika Hisyam Alrasyid",
        "class": "4UPPERA"
    },
    {
        "name": "Muhammad Aiman Adrian",
        "class": "4UPPERA"
    },
    {
        "name": "Muhammad Faqih Mujtaba Althaf",
        "class": "4UPPERA"
    },
    {
        "name": "Muhammad Ghufron Zein",
        "class": "4UPPERA"
    },
    {
        "name": "Muhammad Haidar Kamil",
        "class": "4UPPERA"
    },
    {
        "name": "Muhammad Zhafif Aga",
        "class": "4UPPERA"
    },
    {
        "name": "Nazura Fikri Hamizan",
        "class": "4UPPERA"
    },
    {
        "name": "Pandhu Abid Astaguna",
        "class": "4UPPERA"
    },
    {
        "name": "Rahil Faiq Sunandar",
        "class": "4UPPERA"
    },
    {
        "name": "Salmaan Al-Farisi Soule",
        "class": "4UPPERA"
    },
    {
        "name": "Ulil Albab Ibnu Sholeh",
        "class": "4UPPERA"
    },
    {
        "name": "Zihni Furqon Farabi Ihsan",
        "class": "4UPPERA"
    },
    {
        "name": "Achilles Argaputra Wibowo",
        "class": "4UPPERB"
    },
    {
        "name": "Ardhia Hafy Nugraha",
        "class": "4UPPERB"
    },
    {
        "name": "Bayhaki Kaizan",
        "class": "4UPPERB"
    },
    {
        "name": "Farezza Surya Putra",
        "class": "4UPPERB"
    },
    {
        "name": "Hilman Rhausian Fikri Satria",
        "class": "4UPPERB"
    },
    {
        "name": "Javier Asirwanda",
        "class": "4UPPERB"
    },
    {
        "name": "Keane Alfarezel Kurniawan",
        "class": "4UPPERB"
    },
    {
        "name": "Muhammad Syahdil Arla Wally",
        "class": "4UPPERB"
    },
    {
        "name": "Muhammad Abqary",
        "class": "4UPPERB"
    },
    {
        "name": "Muhammad Hafizh Jillan Firdie",
        "class": "4UPPERB"
    },
    {
        "name": "Muhammad Riezky Narendra",
        "class": "4UPPERB"
    },
    {
        "name": "Naufal Sofdan Athaillah",
        "class": "4UPPERB"
    },
    {
        "name": "Pranayudha Zahran",
        "class": "4UPPERB"
    },
    {
        "name": "Rafa Alvaro Zaky",
        "class": "4UPPERB"
    },
    {
        "name": "Rais Rifai",
        "class": "4UPPERB"
    },
    {
        "name": "Shafa Zikri Khatulistiwa",
        "class": "4UPPERB"
    },
    {
        "name": "Shaleh El Din El Muhammady",
        "class": "4UPPERB"
    },
    {
        "name": "Zidni Ilman Dhia",
        "class": "4UPPERB"
    },
    {
        "name": "Abiyyi Al Hakim Assyauqi",
        "class": "5A"
    },
    {
        "name": "Ahmad Azzam Hilmi Alqodri",
        "class": "5A"
    },
    {
        "name": "Ahmad Labib Affany",
        "class": "5A"
    },
    {
        "name": "Ahmad Yuda Satria",
        "class": "5A"
    },
    {
        "name": "Akbar Izzatu Zikri",
        "class": "5A"
    },
    {
        "name": "Al Fatih Ghaffar Irsyad",
        "class": "5A"
    },
    {
        "name": "Ananda Faiq Ibrahim",
        "class": "5A"
    },
    {
        "name": "Atiyan Ali Da'i",
        "class": "5A"
    },
    {
        "name": "Fachri Rabbani Nurrahman",
        "class": "5A"
    },
    {
        "name": "Galang Thariq Nurmuhammad",
        "class": "5A"
    },
    {
        "name": "Gibran Husein Afdhalla",
        "class": "5A"
    },
    {
        "name": "Haidar Anwari",
        "class": "5A"
    },
    {
        "name": "Humam Zaid Zidan",
        "class": "5A"
    },
    {
        "name": "Muhammad Fadhil Hanifudin",
        "class": "5A"
    },
    {
        "name": "Muhammad Faiz Abdullah",
        "class": "5A"
    },
    {
        "name": "Muhammad Faiz Husain",
        "class": "5A"
    },
    {
        "name": "Muhammad Fattih Kasyfil Ilmi",
        "class": "5A"
    },
    {
        "name": "Muhammad Ilham",
        "class": "5A"
    },
    {
        "name": "Muhammad Irsyad Dhiyaa'il Haq",
        "class": "5A"
    },
    {
        "name": "Muhammad Maulana Ishaq",
        "class": "5A"
    },
    {
        "name": "Muhammad Nabil Ramadhan",
        "class": "5A"
    },
    {
        "name": "Muhammad Nafis Yakhsyallah",
        "class": "5A"
    },
    {
        "name": "Muhammad Nawaf Dzulfadli Fayyadh",
        "class": "5A"
    },
    {
        "name": "Muhammad Rafif Farrel",
        "class": "5A"
    },
    {
        "name": "Mujahid Zulafan Sabilussalam",
        "class": "5A"
    },
    {
        "name": "Padika Rausyanfikr El Mamun",
        "class": "5A"
    },
    {
        "name": "Adhitama Rasya Anakin",
        "class": "5B"
    },
    {
        "name": "Adib Jordi",
        "class": "5B"
    },
    {
        "name": "Afif Adli Firdaus",
        "class": "5B"
    },
    {
        "name": "Ageng Narayana Wijaya Santosa",
        "class": "5B"
    },
    {
        "name": "Akbar Dzulfikar",
        "class": "5B"
    },
    {
        "name": "Akbar Sigit Pramono",
        "class": "5B"
    },
    {
        "name": "Arafat Krisnantaka Wildamar",
        "class": "5B"
    },
    {
        "name": "Arya Gerda Bhamakerti",
        "class": "5B"
    },
    {
        "name": "Azka Adiyatma Brahmantya",
        "class": "5B"
    },
    {
        "name": "Bima Nur Iskandar",
        "class": "5B"
    },
    {
        "name": "Catur Andika Dermawan Putra",
        "class": "5B"
    },
    {
        "name": "Daiyan Mahya Athallah",
        "class": "5B"
    },
    {
        "name": "Damario Pramata Rahagi",
        "class": "5B"
    },
    {
        "name": "Dhi'a Kafka Radiansyach",
        "class": "5B"
    },
    {
        "name": "Dida Fazel Zhafranatha",
        "class": "5B"
    },
    {
        "name": "Eprillio Iqbal Rasendria",
        "class": "5B"
    },
    {
        "name": "Fairuz Dzaki Mulyadi",
        "class": "5B"
    },
    {
        "name": "Hammam Naufa Mabrur",
        "class": "5B"
    },
    {
        "name": "Kenzie Muhammad Zahidan Ardhie",
        "class": "5B"
    },
    {
        "name": "Khalaf Kanza Utomo",
        "class": "5B"
    },
    {
        "name": "M. Rois Achsanul Huda",
        "class": "5B"
    },
    {
        "name": "Muh Farrel Rakha Rajendra M",
        "class": "5B"
    },
    {
        "name": "Muhammad Afkar Raziq",
        "class": "5B"
    },
    {
        "name": "Muhammad Archard Abbasy",
        "class": "5B"
    },
    {
        "name": "Muhammad Faisal Akbar",
        "class": "5B"
    },
    {
        "name": "Muhammad Faiz Sholehuddin",
        "class": "5B"
    },
    {
        "name": "Muhammad Fikri Adnan",
        "class": "5B"
    },
    {
        "name": "Muhammad Nabil Hakim Nugroho",
        "class": "5B"
    },
    {
        "name": "Muhammad Sabiq Alhafidz",
        "class": "5B"
    },
    {
        "name": "Nala Naylan Najahi",
        "class": "5B"
    },
    {
        "name": "Rayi Pamungkas Yahwidhi",
        "class": "5B"
    },
    {
        "name": "Syafiq Shalahuddin",
        "class": "5B"
    },
    {
        "name": "Zaidan Ahsanu 'Amala",
        "class": "5B"
    },
    {
        "name": "Abdilla Rousan Fikri Akbar",
        "class": "5C"
    },
    {
        "name": "Ahmad Badir Hamam Zadisa",
        "class": "5C"
    },
    {
        "name": "Ahmad Maududi Faqih",
        "class": "5C"
    },
    {
        "name": "Ahmad Shiddiq Al Kariem",
        "class": "5C"
    },
    {
        "name": "Arroyan Ulya Anwar",
        "class": "5C"
    },
    {
        "name": "Chalis Zabadi Putra",
        "class": "5C"
    },
    {
        "name": "Fahri Mirza Hanafi",
        "class": "5C"
    },
    {
        "name": "Faqih Najwan Madani",
        "class": "5C"
    },
    {
        "name": "Ibad Naufal Uthman",
        "class": "5C"
    },
    {
        "name": "Isa Azatta Fadhlan Faiq",
        "class": "5C"
    },
    {
        "name": "Juanda Pranata Ritonga",
        "class": "5C"
    },
    {
        "name": "Juhdan Lintang Fahmi Habibi",
        "class": "5C"
    },
    {
        "name": "M. Muttaqin Ar Rasyiidu",
        "class": "5C"
    },
    {
        "name": "Muh. Rifat Zehavi Yasmin",
        "class": "5C"
    },
    {
        "name": "Muhamad Naufal Farisqi",
        "class": "5C"
    },
    {
        "name": "Muhammad Al Fatih",
        "class": "5C"
    },
    {
        "name": "Muhammad Azam Tawakkal",
        "class": "5C"
    },
    {
        "name": "Muhammad Difa Ahnaf",
        "class": "5C"
    },
    {
        "name": "Muhammad Fairuz Nafis Azzahir",
        "class": "5C"
    },
    {
        "name": "Muhammad Fayyadh Irsyad",
        "class": "5C"
    },
    {
        "name": "Muhammad Hilmi Rabbani Abdullah",
        "class": "5C"
    },
    {
        "name": "Muhammad Kimi As Shidiqi",
        "class": "5C"
    },
    {
        "name": "Muhammad Noval",
        "class": "5C"
    },
    {
        "name": "Muhammad Rafha Noorzakki",
        "class": "5C"
    },
    {
        "name": "Muhammad Rusyda Aiqona",
        "class": "5C"
    },
    {
        "name": "Muhammad Tsaqib Arsalan Zain",
        "class": "5C"
    },
    {
        "name": "Nasywa Tifatur Rasyid",
        "class": "5C"
    },
    {
        "name": "Nico Ghulam Mustaqim",
        "class": "5C"
    },
    {
        "name": "Raka Haidar Altaf",
        "class": "5C"
    },
    {
        "name": "Shidiq Dwi Nur Rahman",
        "class": "5C"
    },
    {
        "name": "Sholih Muhammad Faiq Ali Syahada",
        "class": "5C"
    },
    {
        "name": "Zhafir Abhinaya Diera Riyadie",
        "class": "5C"
    },
    {
        "name": "Abrisam Ahza Saladin Arsyad",
        "class": "5D"
    },
    {
        "name": "Alfael Rumi",
        "class": "5D"
    },
    {
        "name": "Aryanur Tegar Pribadi",
        "class": "5D"
    },
    {
        "name": "Auditya Ahmad Madani",
        "class": "5D"
    },
    {
        "name": "Daffa Rasendriya Firdaus",
        "class": "5D"
    },
    {
        "name": "Evan Febrian Wahyuriski",
        "class": "5D"
    },
    {
        "name": "Fadhil Muhammad Taqiyulloh",
        "class": "5D"
    },
    {
        "name": "Fakhri Raditya Affandi",
        "class": "5D"
    },
    {
        "name": "Fathan Abqo Sidiq",
        "class": "5D"
    },
    {
        "name": "Fathullah Qamarul Adzami Samal",
        "class": "5D"
    },
    {
        "name": "Fausta Dharu Reginald",
        "class": "5D"
    },
    {
        "name": "Gunawan Agung Christianto",
        "class": "5D"
    },
    {
        "name": "Ilham Risky Saputra",
        "class": "5D"
    },
    {
        "name": "Irvin Kalevi El Zurafa",
        "class": "5D"
    },
    {
        "name": "M Adnan Kamil Syairozi",
        "class": "5D"
    },
    {
        "name": "M. Afuww Galih Jati",
        "class": "5D"
    },
    {
        "name": "Muhammad Abqari Zakwannur",
        "class": "5D"
    },
    {
        "name": "Muhammad Alzam Pradana",
        "class": "5D"
    },
    {
        "name": "Muhammad Dafi Abqory",
        "class": "5D"
    },
    {
        "name": "Muhammad Fadlan Nadhif",
        "class": "5D"
    },
    {
        "name": "Muhammad Fa'iz",
        "class": "5D"
    },
    {
        "name": "Muhammad Fathin Ar Rosyid",
        "class": "5D"
    },
    {
        "name": "Muhammad Ilham Khoirullah",
        "class": "5D"
    },
    {
        "name": "Muhammad Miqdad Nur Al Haqqi",
        "class": "5D"
    },
    {
        "name": "Muhammad Raziq Niswardi Azhar",
        "class": "5D"
    },
    {
        "name": "Nabil Abrar",
        "class": "5D"
    },
    {
        "name": "Naufal Ramadhan Putra Wibowo",
        "class": "5D"
    },
    {
        "name": "Naufal Yatha Nugroho",
        "class": "5D"
    },
    {
        "name": "Raafi Annas Majid",
        "class": "5D"
    },
    {
        "name": "Satria Bamakerti Adz-Dzaki",
        "class": "5D"
    },
    {
        "name": "Syafatullah Ismail Pamungkas",
        "class": "5D"
    },
    {
        "name": "Zaidan Mumtaz",
        "class": "5D"
    },
    {
        "name": "Abiyyu Fikri",
        "class": "5E"
    },
    {
        "name": "Adnan Azukhri",
        "class": "5E"
    },
    {
        "name": "Afif Daegal",
        "class": "5E"
    },
    {
        "name": "Ahmad Darwis Al Kahfi",
        "class": "5E"
    },
    {
        "name": "Ahmad Royyan Al Maqdis",
        "class": "5E"
    },
    {
        "name": "Ahmad Syarif Rajendra Nata",
        "class": "5E"
    },
    {
        "name": "Ajda Satria Wistara",
        "class": "5E"
    },
    {
        "name": "Akbar Shidqi Al Karim",
        "class": "5E"
    },
    {
        "name": "Al Fath Malik Sidik",
        "class": "5E"
    },
    {
        "name": "Alvino Arkan",
        "class": "5E"
    },
    {
        "name": "Chairul Farand Dhiaulhaq",
        "class": "5E"
    },
    {
        "name": "Cleon Ivander Xavier",
        "class": "5E"
    },
    {
        "name": "Davito Al Kindi",
        "class": "5E"
    },
    {
        "name": "Fairuz Husni Firmansyah",
        "class": "5E"
    },
    {
        "name": "Fawwaz Maulana Divian",
        "class": "5E"
    },
    {
        "name": "Genta Hasyarafi",
        "class": "5E"
    },
    {
        "name": "Halid Tsaqib Fawwas F.",
        "class": "5E"
    },
    {
        "name": "Jesen Mahardika",
        "class": "5E"
    },
    {
        "name": "Muhammad Danish Azriel",
        "class": "5E"
    },
    {
        "name": "Muhammad Luthfi Hakim",
        "class": "5E"
    },
    {
        "name": "Muhammad Malik Annafi",
        "class": "5E"
    },
    {
        "name": "Muhammad Ryanza Ramadhan",
        "class": "5E"
    },
    {
        "name": "Navid Adya Al-farisy",
        "class": "5E"
    },
    {
        "name": "Ahmad Hanafi Fauzi",
        "class": "5F"
    },
    {
        "name": "Ahmad Hanif Chadziq Mirdaz",
        "class": "5F"
    },
    {
        "name": "Darrel Fabiano",
        "class": "5F"
    },
    {
        "name": "Dzaki Nazakha Ali Syakib",
        "class": "5F"
    },
    {
        "name": "Fadhil Ahmad Syakir",
        "class": "5F"
    },
    {
        "name": "Fadhlan Habibie",
        "class": "5F"
    },
    {
        "name": "Faiz Bazli Fitra Ikhlas",
        "class": "5F"
    },
    {
        "name": "Hadyan Muhammad Ihsan",
        "class": "5F"
    },
    {
        "name": "Lintang Anugro Hidayat",
        "class": "5F"
    },
    {
        "name": "Muhammad Al Fatih",
        "class": "5F"
    },
    {
        "name": "Muhammad Dafa Al Fatih",
        "class": "5F"
    },
    {
        "name": "Muhammad Dzaki",
        "class": "5F"
    },
    {
        "name": "Muhammad Farel Zafran Adelio",
        "class": "5F"
    },
    {
        "name": "Muhammad Fawwaz Arsyad",
        "class": "5F"
    },
    {
        "name": "Muhammad Fikri Parakas",
        "class": "5F"
    },
    {
        "name": "Mukhammad Roid Rafif Dzakwan",
        "class": "5F"
    },
    {
        "name": "Najib Zaini",
        "class": "5F"
    },
    {
        "name": "Najwan Abdurrahman",
        "class": "5F"
    },
    {
        "name": "Nur Muhammad Alfaridi",
        "class": "5F"
    },
    {
        "name": "Pilar Arloen Wijoyo",
        "class": "5F"
    },
    {
        "name": "Qaizer Haildhi Alyandra",
        "class": "5F"
    },
    {
        "name": "Ra-atsar Wiyaris Qulub",
        "class": "5F"
    },
    {
        "name": "Radhia Muhammad Izzulhaq",
        "class": "5F"
    },
    {
        "name": "Rakha Hanif Arkana Laksono",
        "class": "5F"
    },
    {
        "name": "Rasheed Ragheb Farzany",
        "class": "5F"
    },
    {
        "name": "Zahid Jirga Karzani",
        "class": "5F"
    },
    {
        "name": "Ade Almukhsin Mahoya",
        "class": "5UPPERA"
    },
    {
        "name": "Ahmad Rakha Fazli Mawla Umar",
        "class": "5UPPERA"
    },
    {
        "name": "Aidil Nur Khaizuram",
        "class": "5UPPERA"
    },
    {
        "name": "Bilal Azfar Andira",
        "class": "5UPPERA"
    },
    {
        "name": "Dzaky Akhdan Rafif Ath-thoriq",
        "class": "5UPPERA"
    },
    {
        "name": "Faris Ahmad Nurtawab",
        "class": "5UPPERA"
    },
    {
        "name": "Faza Rama Narendra",
        "class": "5UPPERA"
    },
    {
        "name": "Ighra Kayyas J. Al Aziz",
        "class": "5UPPERA"
    },
    {
        "name": "Mochammad Faza Aqila",
        "class": "5UPPERA"
    },
    {
        "name": "Muhammad Albyandra Aqvalo Mei Havendi",
        "class": "5UPPERA"
    },
    {
        "name": "Muhammad Asyraf Nazhif Yufa",
        "class": "5UPPERA"
    },
    {
        "name": "Muhammad Atha Haidar",
        "class": "5UPPERA"
    },
    {
        "name": "Muhammad Rifyal Al Farizy Wayoi",
        "class": "5UPPERA"
    },
    {
        "name": "Riefda Elang Persada",
        "class": "5UPPERA"
    },
    {
        "name": "Satria Al Shatir",
        "class": "5UPPERA"
    },
    {
        "name": "Tsaqif Al-Fattah",
        "class": "5UPPERA"
    },
    {
        "name": "Zaydan Qory Syahbana",
        "class": "5UPPERA"
    },
    {
        "name": "Ahmad Nuzul Furqon Pasaribu",
        "class": "5UPPERB"
    },
    {
        "name": "Ahmad Sururi Al Ghoffar",
        "class": "5UPPERB"
    },
    {
        "name": "Andi Muhammad Izzat",
        "class": "5UPPERB"
    },
    {
        "name": "Chaizuran Alifunnadhif Azigha",
        "class": "5UPPERB"
    },
    {
        "name": "Chaizuran Arasyaqil Ghaisan",
        "class": "5UPPERB"
    },
    {
        "name": "Favian Hugadinata",
        "class": "5UPPERB"
    },
    {
        "name": "Humam Azman Dzikraka",
        "class": "5UPPERB"
    },
    {
        "name": "Muhammad Althaf Haidar",
        "class": "5UPPERB"
    },
    {
        "name": "Muhammad Alvaro Azisi",
        "class": "5UPPERB"
    },
    {
        "name": "Muhammad Dhiaulhaq Mujiburrahman Aditama",
        "class": "5UPPERB"
    },
    {
        "name": "Narendra Javas Pambudi",
        "class": "5UPPERB"
    },
    {
        "name": "Omar Maqil Ghaisan",
        "class": "5UPPERB"
    },
    {
        "name": "Radintha Shiddqy Ghaisani Razano",
        "class": "5UPPERB"
    },
    {
        "name": "Ahmad Fakhir Avila",
        "class": "5UPPERC"
    },
    {
        "name": "Alif Yusuf Iskandar",
        "class": "5UPPERC"
    },
    {
        "name": "Bidara Tidore Membumigora",
        "class": "5UPPERC"
    },
    {
        "name": "Dzaka Bisma Adikara",
        "class": "5UPPERC"
    },
    {
        "name": "Hafidz Ahmad Jauhari",
        "class": "5UPPERC"
    },
    {
        "name": "Hafidz Nourikhlas Elquthb",
        "class": "5UPPERC"
    },
    {
        "name": "Muhammad Alif Pratama",
        "class": "5UPPERC"
    },
    {
        "name": "Nabigh Akmal Al Azizi",
        "class": "5UPPERC"
    },
    {
        "name": "Tualang Philosofi Ahimsa",
        "class": "5UPPERC"
    },
    {
        "name": "Ahmad Abrisam Awaluddin",
        "class": "6A"
    },
    {
        "name": "Arash Fardad Muhammad Fateh",
        "class": "6A"
    },
    {
        "name": "Ardiansyah Rafi Ramadhan",
        "class": "6A"
    },
    {
        "name": "Bagus Murtadha Ayyasy Putra Amin",
        "class": "6A"
    },
    {
        "name": "Fathurrahman Al-Mumtaz",
        "class": "6A"
    },
    {
        "name": "Fatih Fazliansyah",
        "class": "6A"
    },
    {
        "name": "Ghatfan Muhammad Attar",
        "class": "6A"
    },
    {
        "name": "Ghozi Yazid Rahman",
        "class": "6A"
    },
    {
        "name": "Hibban Ammar Ismail",
        "class": "6A"
    },
    {
        "name": "Imaduddin Aufal Marom",
        "class": "6A"
    },
    {
        "name": "M. Kasyfi Rahman",
        "class": "6A"
    },
    {
        "name": "Miqdad",
        "class": "6A"
    },
    {
        "name": "Miqdad Nasrullah Ali",
        "class": "6A"
    },
    {
        "name": "Moch. Gaidan Fahdani Ramadhan",
        "class": "6A"
    },
    {
        "name": "Mohammad Hamzah Raza Alfaridzi",
        "class": "6A"
    },
    {
        "name": "Muhammad Fadhil Gadaffi",
        "class": "6A"
    },
    {
        "name": "Muhammad Hafiizh Vernardyansyah",
        "class": "6A"
    },
    {
        "name": "Muhammad Luthfi Kurniawan",
        "class": "6A"
    },
    {
        "name": "Muhammad Nur Faiz",
        "class": "6A"
    },
    {
        "name": "Muhammad Rafi Athaullah",
        "class": "6A"
    },
    {
        "name": "Nabhan 'Abid Muhanna",
        "class": "6A"
    },
    {
        "name": "Nashiruddin Arwi Al-Musyafiq",
        "class": "6A"
    },
    {
        "name": "Rafa Hamiz Azizan",
        "class": "6A"
    },
    {
        "name": "Rafif Attaya Zahran",
        "class": "6A"
    },
    {
        "name": "Raihan Fadilah Anwar",
        "class": "6A"
    },
    {
        "name": "Ridwan Latief Abimanyu",
        "class": "6A"
    },
    {
        "name": "Sholahudin Al-Ayyubi",
        "class": "6A"
    },
    {
        "name": "Umar Faruq",
        "class": "6A"
    },
    {
        "name": "Zaydan Rafi Mubarak",
        "class": "6A"
    },
    {
        "name": "Ahmad Faiz Ramadhiansyah",
        "class": "6B"
    },
    {
        "name": "Alfario Futtaqi Hartono",
        "class": "6B"
    },
    {
        "name": "Alfi Khairi Mumtaza",
        "class": "6B"
    },
    {
        "name": "Arkan Zumair Hisyam",
        "class": "6B"
    },
    {
        "name": "Aryasatya Kayana Hasyim",
        "class": "6B"
    },
    {
        "name": "Azmi Akrami Maha",
        "class": "6B"
    },
    {
        "name": "Bahtiar Aulia",
        "class": "6B"
    },
    {
        "name": "Bilal Salmana Firdaus",
        "class": "6B"
    },
    {
        "name": "Fadhil Muhammad",
        "class": "6B"
    },
    {
        "name": "Fahri Aulia Hardinanda",
        "class": "6B"
    },
    {
        "name": "Fahriz Wijdan Khalfani Rahman",
        "class": "6B"
    },
    {
        "name": "Farros Daffa Nibroos Munna Mulia",
        "class": "6B"
    },
    {
        "name": "Fathun Nejad El Wafy",
        "class": "6B"
    },
    {
        "name": "Giland Raffasya Al Ghazali",
        "class": "6B"
    },
    {
        "name": "Giswa Bintang Anugrah",
        "class": "6B"
    },
    {
        "name": "Harel Haidar Novandra",
        "class": "6B"
    },
    {
        "name": "Helmi Rafif Firdyawan",
        "class": "6B"
    },
    {
        "name": "Ibrahim Rafif Surya Abdullah",
        "class": "6B"
    },
    {
        "name": "Lutfan Aufa Ghozi",
        "class": "6B"
    },
    {
        "name": "Mikail Obama Mufreni",
        "class": "6B"
    },
    {
        "name": "Muhammad Baihaqi Purnomo",
        "class": "6B"
    },
    {
        "name": "Muhammad Faishal Hakim",
        "class": "6B"
    },
    {
        "name": "Muhammad Fayruz Athaillah",
        "class": "6B"
    },
    {
        "name": "Muhammad Qoyyim Annafi'a Baihaqi",
        "class": "6B"
    },
    {
        "name": "Muhammad Rofi' Arkan Islami",
        "class": "6B"
    },
    {
        "name": "Muhammad Sami Azzam Al Ghazali",
        "class": "6B"
    },
    {
        "name": "Muhammad Thoriq Shidqi Sabiq",
        "class": "6B"
    },
    {
        "name": "Muhammad Zidane Falakhrie",
        "class": "6B"
    },
    {
        "name": "Nayaka Bani Rajendra",
        "class": "6B"
    },
    {
        "name": "Raditya Aqila Wicaksono",
        "class": "6B"
    },
    {
        "name": "Ramadhiandra Ghifariel Izra Yunatria",
        "class": "6B"
    },
    {
        "name": "Abid Fidinillah",
        "class": "6C"
    },
    {
        "name": "Ahmad Hanif Aljabbar",
        "class": "6C"
    },
    {
        "name": "Akhdan Attar Zwagery",
        "class": "6C"
    },
    {
        "name": "Al Jauhar Rofid Rustandi",
        "class": "6C"
    },
    {
        "name": "Alfian Redho Muhammady",
        "class": "6C"
    },
    {
        "name": "Arkan Reva Noorazizi",
        "class": "6C"
    },
    {
        "name": "Bintang Akbar Putra Nugroho",
        "class": "6C"
    },
    {
        "name": "Daffa Adya Rachmad",
        "class": "6C"
    },
    {
        "name": "Faiq Arrafi Rakan",
        "class": "6C"
    },
    {
        "name": "Farhat Amnu Zilzal Oktavino Putra Ashita",
        "class": "6C"
    },
    {
        "name": "Fazle Robby",
        "class": "6C"
    },
    {
        "name": "Gesit Firman Prapcahyo",
        "class": "6C"
    },
    {
        "name": "Haidar Muhammad Hidayat",
        "class": "6C"
    },
    {
        "name": "Hudzaifah Abdul Fattah",
        "class": "6C"
    },
    {
        "name": "Lauhmahfuziqri Al Ayyubi",
        "class": "6C"
    },
    {
        "name": "M. Irham Ismail",
        "class": "6C"
    },
    {
        "name": "Makocandika Arundaya Prajuritno",
        "class": "6C"
    },
    {
        "name": "Muhammad Akmal Arro'uuf",
        "class": "6C"
    },
    {
        "name": "Muhammad Alfa As'shiddiqi",
        "class": "6C"
    },
    {
        "name": "Muhammad Bagas Sanjaya",
        "class": "6C"
    },
    {
        "name": "Muhammad Ezra Adri Tampubolon",
        "class": "6C"
    },
    {
        "name": "Muhammad Fairuz Zaidan",
        "class": "6C"
    },
    {
        "name": "Muhammad Fatih Hakim",
        "class": "6C"
    },
    {
        "name": "Muhammad Rizvan Ahnaf",
        "class": "6C"
    },
    {
        "name": "Nadhir Mahmud Radito",
        "class": "6C"
    },
    {
        "name": "Najmii Shula Hibatullah",
        "class": "6C"
    },
    {
        "name": "Naufan Azka Waluyo",
        "class": "6C"
    },
    {
        "name": "Raditya Dimas Widyawardana",
        "class": "6C"
    },
    {
        "name": "Salman Al-Farisi",
        "class": "6C"
    },
    {
        "name": "Taqiyullah Amurwabhumi",
        "class": "6C"
    },
    {
        "name": "Tegar Valencia Rafhiko Pasha",
        "class": "6C"
    },
    {
        "name": "Abdillah Adlan Wicaksana",
        "class": "6D"
    },
    {
        "name": "Ahmad Ali Daffa",
        "class": "6D"
    },
    {
        "name": "Ahmad Muflih Satrio",
        "class": "6D"
    },
    {
        "name": "Akhmad Ravi Dhanissworo",
        "class": "6D"
    },
    {
        "name": "Arib Muhammad Hisyam",
        "class": "6D"
    },
    {
        "name": "Athalla Aryaputra Widodo",
        "class": "6D"
    },
    {
        "name": "Fachri Bagus Wibowo",
        "class": "6D"
    },
    {
        "name": "Fairuz Fawwazul Akmal",
        "class": "6D"
    },
    {
        "name": "Fa'iq Abiyyu Zuhri",
        "class": "6D"
    },
    {
        "name": "Faiz Akmal Saifudin",
        "class": "6D"
    },
    {
        "name": "Fikri Aziz Avrilian",
        "class": "6D"
    },
    {
        "name": "Gusti Aditya",
        "class": "6D"
    },
    {
        "name": "Intifadhah Al-Aqsha Anas",
        "class": "6D"
    },
    {
        "name": "Lintang Abdullah",
        "class": "6D"
    },
    {
        "name": "Mirza Rafi Susanto",
        "class": "6D"
    },
    {
        "name": "Mochammad Hilmy Izzudin Arrasyid",
        "class": "6D"
    },
    {
        "name": "Muhammad Affan Fahrurrozi",
        "class": "6D"
    },
    {
        "name": "Muhammad Bintang Al Hafidz",
        "class": "6D"
    },
    {
        "name": "Muhammad Haedar Rizky Anwar",
        "class": "6D"
    },
    {
        "name": "Muhammad Iqbal Azzahir",
        "class": "6D"
    },
    {
        "name": "Muhammad Mannan Arrahmi",
        "class": "6D"
    },
    {
        "name": "Muhammad Mufassyah Dewandaru",
        "class": "6D"
    },
    {
        "name": "Muhammad Razzan Syahid",
        "class": "6D"
    },
    {
        "name": "Muhammad Zahran Istaz Solichin",
        "class": "6D"
    },
    {
        "name": "Nabil Abiyu Khairi",
        "class": "6D"
    },
    {
        "name": "Nehan Kaysan Fikri Susilo",
        "class": "6D"
    },
    {
        "name": "Pandya Aqila Rianto",
        "class": "6D"
    },
    {
        "name": "Rasyiq Asyrafa Baihaqi",
        "class": "6D"
    },
    {
        "name": "Yaafi Ramadhan Yugastian",
        "class": "6D"
    },
    {
        "name": "Yafa Ghani Arrasyid",
        "class": "6D"
    },
    {
        "name": "Abdan Husaini Lathif",
        "class": "6E"
    },
    {
        "name": "Ahnaf Ghazy Aljabar",
        "class": "6E"
    },
    {
        "name": "Arfa Rausyan Failasuf",
        "class": "6E"
    },
    {
        "name": "Asa Kemal Dhanurendra",
        "class": "6E"
    },
    {
        "name": "Asyam Taufiqurrahman Setyawan",
        "class": "6E"
    },
    {
        "name": "Asyraf Raziq Muzeizin",
        "class": "6E"
    },
    {
        "name": "Ayaka Fawwaz Al-Arsy",
        "class": "6E"
    },
    {
        "name": "Azis Army Alfaridzi",
        "class": "6E"
    },
    {
        "name": "Bagaskara Anyunari Boemi",
        "class": "6E"
    },
    {
        "name": "Damar Al Fathih",
        "class": "6E"
    },
    {
        "name": "Fadel Ahmad Thufail",
        "class": "6E"
    },
    {
        "name": "Faeyza Azka Putra Jovano",
        "class": "6E"
    },
    {
        "name": "Fathu Rizqi Almubarok",
        "class": "6E"
    },
    {
        "name": "Iqbal Qodama Khoirurrijal",
        "class": "6E"
    },
    {
        "name": "M Zaidan Aulia Bhakti",
        "class": "6E"
    },
    {
        "name": "M. Anas Afif Alfadil",
        "class": "6E"
    },
    {
        "name": "M. Wafizzaliq",
        "class": "6E"
    },
    {
        "name": "Muflih Davin Kurniawan",
        "class": "6E"
    },
    {
        "name": "Muhamad Fauzan Hilmy Ramadhan",
        "class": "6E"
    },
    {
        "name": "Muhammad Azzamy Syauqi",
        "class": "6E"
    },
    {
        "name": "Muhammad Daffa Dary Yardan",
        "class": "6E"
    },
    {
        "name": "Muhammad Farras Kurnia",
        "class": "6E"
    },
    {
        "name": "Muhammad Rizky Setiawan",
        "class": "6E"
    },
    {
        "name": "Muhammad Sholahudin Rasya Habibie",
        "class": "6E"
    },
    {
        "name": "Muhammad Syawal Satriaji Sarwodamono",
        "class": "6E"
    },
    {
        "name": "Muhammad Yardan",
        "class": "6E"
    },
    {
        "name": "Nahla Kemal Rayya Abrisam",
        "class": "6E"
    },
    {
        "name": "Nathan Ferdwiansyah Wicaksono",
        "class": "6E"
    },
    {
        "name": "Naufal Surya Putra",
        "class": "6E"
    },
    {
        "name": "Naufal Syamil Adz Dzaki",
        "class": "6E"
    },
    {
        "name": "Radithya Mahardika Dzaky",
        "class": "6E"
    },
    {
        "name": "Rais Widaya Jati",
        "class": "6E"
    },
    {
        "name": "Adisya Zaidi Azka Ridho",
        "class": "6F"
    },
    {
        "name": "Ahmad Tsaqiif Hikmatul Akbar",
        "class": "6F"
    },
    {
        "name": "Aldan Arziki Budiman",
        "class": "6F"
    },
    {
        "name": "Alif Auliansyah Rombedatu",
        "class": "6F"
    },
    {
        "name": "Aryadinata Nail Ghaniyahya",
        "class": "6F"
    },
    {
        "name": "Ashabul Kahfi Ad Dahi",
        "class": "6F"
    },
    {
        "name": "Barack Aulia Habibie",
        "class": "6F"
    },
    {
        "name": "Faiz Nakhla Makarim",
        "class": "6F"
    },
    {
        "name": "Fakhri Asyrof",
        "class": "6F"
    },
    {
        "name": "Faris Alluthfi",
        "class": "6F"
    },
    {
        "name": "Maulana Zaki Annafi Al Fawwaz",
        "class": "6F"
    },
    {
        "name": "Muhammad Azka Fayyadha Irfani",
        "class": "6F"
    },
    {
        "name": "Muhammad Zhariif Rezaul Kharim",
        "class": "6F"
    },
    {
        "name": "Naufal Fairuz Zaky",
        "class": "6F"
    },
    {
        "name": "Nizam Adnan Pradipta Abimanyu",
        "class": "6F"
    },
    {
        "name": "Nolan Rahardian Syafiq",
        "class": "6F"
    },
    {
        "name": "Pandeda Afwa Diano",
        "class": "6F"
    },
    {
        "name": "Pandji Anung Anindhita",
        "class": "6F"
    },
    {
        "name": "Rafka Akhdana Afira Putra",
        "class": "6F"
    },
    {
        "name": "Raihan Baariq Al Azmi",
        "class": "6F"
    },
    {
        "name": "Raya Abyan Arganata",
        "class": "6F"
    },
    {
        "name": "Rizqi Lingga Alvaro",
        "class": "6F"
    },
    {
        "name": "Tarangga Fawwaz",
        "class": "6F"
    },
    {
        "name": "Umar Rizalie Al-Amrie",
        "class": "6F"
    },
    {
        "name": "Alan Dimitri Alfashi Rotty",
        "class": "6G"
    },
    {
        "name": "Daffi Adya Rachmad",
        "class": "6G"
    },
    {
        "name": "Degda Pranawaseta",
        "class": "6G"
    },
    {
        "name": "Dzaky Adhyasta Ramadhan",
        "class": "6G"
    },
    {
        "name": "Emha Azmi Reyno Putra",
        "class": "6G"
    },
    {
        "name": "Farchan Ilmy Musyaffa",
        "class": "6G"
    },
    {
        "name": "Fauzan Taquyuddin Achmad",
        "class": "6G"
    },
    {
        "name": "Ichsanul Fathu Ramadhan Putra",
        "class": "6G"
    },
    {
        "name": "Irsyad Faizul Allam",
        "class": "6G"
    },
    {
        "name": "Mohammad Kanz Al Jauzi",
        "class": "6G"
    },
    {
        "name": "Mubarok Azam Elfani",
        "class": "6G"
    },
    {
        "name": "Muhammad Akbar Sulaiman",
        "class": "6G"
    },
    {
        "name": "Muhammad Alif Mirza",
        "class": "6G"
    },
    {
        "name": "Muhammad Fajri Ramadhan",
        "class": "6G"
    },
    {
        "name": "Muhammad Nailil Akbar",
        "class": "6G"
    },
    {
        "name": "Naufal Azka Syafiqi",
        "class": "6G"
    },
    {
        "name": "Nufail Hilmy",
        "class": "6G"
    },
    {
        "name": "Patria Bumi Cendekia",
        "class": "6G"
    },
    {
        "name": "Rafie Azizan Arrasyid",
        "class": "6G"
    },
    {
        "name": "Rizqi Mulia Al Fajr",
        "class": "6G"
    },
    {
        "name": "Septian Abdillah Muttaqin",
        "class": "6G"
    },
    {
        "name": "Yashfa Jauhar",
        "class": "6G"
    },
    {
        "name": "Zaidan Shodiq",
        "class": "6G"
    },
    {
        "name": "Zundha Ardani Setiawan",
        "class": "6G"
    },
    {
        "name": "Aji Pangeran Muhammad Afta Fabyan Kurniawan",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Alee El Husaeny",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Arshavin Fauza Rohman",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Brian Haykal Rahmanta",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Faqih Qowiyyun Amin Hamdani",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Ilham Adyamulya",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Jawda Zahi Alghani",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Jibran Muhafiz Nubaid",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Jingga Sanubari Anugrah Binar Pakerti",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Maulana Alpatena",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Miftachul Habib Ristian",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Aakif Hidayat",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Adhi Rasya Pujaningtyas",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Akhdan Al Hakam",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Kaysan Rafay Firdaus",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Khairi Nafi'",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Raihan Arroyyan",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Sabilillah",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Muhammad Yattaqi Rosyida",
        "class": "6INTERNASIONAL"
    },
    {
        "name": "Rauf Ibad",
        "class": "6INTERNASIONAL"
    }
];

// Data kontak Musyrif per kelas (Resmi & Terkini 2026)
export const musyrifData = {
    // Kelas 1
    '1A': { name: 'Ustadz Wahyu Dermawan', email: 'wahyudermawan1212@gmail.com', number: '6282180998704', waliKelas: 'Dwi Pembangun Ari Yuwono, S.Pd.' },
    '1B': { name: 'Ustadz Muhammad Farras Mamduh', email: 'farrasmdh@gmail.com', number: '6285117104411', waliKelas: 'Muhammad Irfan Syihab, S.Hum.' },
    '1C': { name: 'Ustadz Leo Fernando Adnan Muzaki', email: 'leodrfernandofelix@gmail.com', number: '6285701209925', waliKelas: 'Drs. Supriyono' },
    '1D': { name: 'Ustadz Husein Nur Alwany', email: 'husennur085@gmail.com', number: '6285157379443', waliKelas: 'Ahmad Suryani, S.Ag, M.S.I.' },
    '1E': { name: 'Ustadz Arif Rahman, S.s.', email: 'nitikan3321@gmail.com', number: '6285129334523', waliKelas: 'Ahmad Afifuddin Syarif, S.Pd' },
    '1F': { name: 'Ustadz M. Fajri', email: '', number: '6285189076745', waliKelas: 'Fajar Nurahman, S.Pd.' },
    '1G': { name: 'Ustadz Ajie Saptian Hardiyanto', email: 'saptianaji07@gmail.com', number: '6285198234739', waliKelas: 'Hery Nugroho, S.Pd.' },
    '1LOWERA': { name: 'Ustadz Muhammad Maliq Hakeem', email: 'muhammadmaliqhkm@gmail.com', number: '6282342754336', waliKelas: 'Syahda Agustian Supriyanto, S.Pd.' },
    '1LOWERB': { name: 'Ustadz Bryan Mahir Muharram', email: 'bryanmuharram06@gmail.com', number: '6282140095932', waliKelas: 'Yusup Siradz, S.Pd.I, M.S.I.' },
    '1LOWERC': { name: 'Ustadz Auzia Difa Mubarok', email: 'difaamubaarak@gmail.com', number: '6289526256385', waliKelas: 'Imam Rosyidi, S.Ag.' },

    // Kelas 2
    '2A': { name: 'Ustadz Arhab Syamil Asy Syatori', email: 'arhab.syamil4@gmail.com', number: '6282145765850', waliKelas: 'Husnan Wadi. S.H.I. M.P.I.' },
    '2B': { name: 'Ustadz Muhammad Dhaim Aruna', email: 'dhaimaruna@gmail.com', number: '628156554524', waliKelas: 'Agus Widodo, S.Pd.' },
    '2C': { name: 'Ustadz Ivan Nur Adrian Pratama', email: 'ivannur224@gmail.com', number: '6288983127506', waliKelas: 'Solehuddin, S.Pd.' },
    '2D': { name: 'Ustadz Muhammad Atqonuddinillah', email: 'muhammadatqonuddinnilah@gmail.com', number: '6281225054570', waliKelas: 'Sofyan Pradivatno, S.Pd.' },
    '2E': { name: 'Ustadz Nur Affan Muarif, S.Sos.', email: 'affanmuarif99@gmail.com', number: '6282216678182', waliKelas: 'Samsu Widayat, S.Pd.' },
    '2F': { name: 'Ustadz Muhammad Rafi Umar Rais', email: 'rafiumar420@gmail.com', number: '6285854312222', waliKelas: 'Lilik Wijayanto, S.Pd.' },
    '2G': { name: 'Ustadz Muhammad Arfa Burhanuddin Rafif', email: 'arfaburhan2008@gmail.com', number: '6281233795288', waliKelas: 'Aswin Prayogi Wijaya, S.H.' },
    '2H': { name: 'Ustadz Imam Tunisi', email: 'mamtun17@gmail.com', number: '62895635128151', waliKelas: 'Yunus Nur Hidayat, M.Pd.' },
    '2LOWERA': { name: 'Ustadz Muhammad Adhwa Janitra Handoko', email: 'handokohowareyou@gmail.com', number: '6287786969082', waliKelas: 'Yudhi Wiyoko, S.Si.' },
    '2LOWERB': { name: 'Ustadz Zaky Risky Kurniawan', email: 'zakyrisky182@gmail.com', number: '6288983445038', waliKelas: 'Muhammad Faisal Fakhrurozi, S.Pd.' },
    '2LOWERC': { name: 'Ustadz Farrel Izham Prayitno, Lc., S.Pd.', email: 'itsmefarrelizhamp@gmail.com', number: '6285217017024', waliKelas: 'M. Afdhol Mufti Alhakiki, S.Pd.' },

    // Kelas 3
    '3A': { name: 'Ustadz Abdullah, S.Pd.', email: 'abdullahmuallimin@muallimin.sch.id', number: '62881025916368', waliKelas: 'H. Muhammad Munawir, S.Pd.' },
    '3B': { name: 'Ustadz Mukti Abdul Ghofar', email: 'muktighofar705@gmail.com', number: '6282241379820', waliKelas: 'Navif Fairuza, M.Hum.' },
    '3C': { name: 'Ustadz Fadhl Maula Fawwas', email: 'maulafawas@gmail.com', number: '6281228679325', waliKelas: 'Agus Mianta, S.Si., M.Pd.' },
    '3D': { name: 'Ustadz Fauzan Tasykurun Akmal', email: 'fauzanakmaal15@gmail.com', number: '6287833527289', waliKelas: 'Purwanto, S.Ag.' },
    '3E': { name: 'Ustadz Muhammad Syaqib Ridho Asy Syafiq', email: 'idoosakippp@gmail.com', number: '628988158493', waliKelas: 'Banar Widayat, S.Pd.' },
    '3F': { name: 'Ustadz Muhammad Islam Al Ghozy', email: 'muhammadislamalghozy2801@gmail.com', number: '6281233421108', waliKelas: 'Yohan Yulianto, S.Pd.' },
    '3G': { name: 'Ustadz Ahmad Arif Kurniawan', email: 'ahmadarifkurniawan1809@gmail.com', number: '6282233624304', waliKelas: 'Farid Imron, S.Pd.I.' },
    '3H': { name: 'Ustadz Hasan', email: '', number: '6289509904184', waliKelas: 'Supriantara, S.T, S.Kom., M.Kom.' },
    '3UPPERA': { name: 'Ustadz Naufal Muzakki', email: 'naufalmuzakki.idn@gmail.com', number: '6287844185012', waliKelas: 'Zulkifli, S.Pd.I., M.Pd.I.' },
    '3UPPERB': { name: 'Ustadz Mouldy Mohammad Zayyed', email: 'mouldymaz@gmail.com', number: '6285155347353', waliKelas: 'Andi Mujahid, S.E.I' },

    // Kelas 4
    '4A': { name: 'Ustadz Mukti Abdul Ghofur', email: 'muktighofur75@gmail.com', number: '6282322272355', waliKelas: 'Mohammad Sanusi, S.H.I.' },
    '4B': { name: 'Ustadz Rayhan Bachtiar Dwi Bayu Baskara', email: 'rayhan.baskara68@gmail.com', number: '6281225841078', waliKelas: 'Rizki Ridho Pratama, S.Pd.' },
    '4C': { name: 'Ustadz Zahdal Aisy Rahman Averusy', email: 'zedzuhaid@gmail.com', number: '6282132910079', waliKelas: 'Masrur Ridwan, M.Pd.' },
    '4D': { name: 'Ustadz Rifqi Adha Pradipa', email: 'rifqipradipa62@gmail.com', number: '6287769943357', waliKelas: 'Muh. Taffani Kusuma Wardana, S.Si.' },
    '4E': { name: 'Ustadz Rasya Adhar Al Islam', email: 'rasyaadhar3012@gmail.com', number: '62895402680315', waliKelas: 'Cresna Anguila Sidiq, S.S.' },
    '4F': { name: 'Ustadz Moh. Rival Aldiyansah', email: 'rivalaldiyansyah@muallimin.sch.id', number: '6285706095527', waliKelas: 'Syaifullah K. Boli, S.Pd.' },
    '4UPPERA': { name: 'Ustadz Ayyasy Kaizen Birruna', email: 'catatankaizen@gmail.com', number: '6285930404552', waliKelas: 'Dhimas Ardya Riadus Sholikhin, S.Pd.' },
    '4UPPERB': { name: 'Ustadz Hafidz Nawaf Fauzil Adhim, S.Pd.', email: 'fauziladhim2001@gmail.com', number: '6282241935414', waliKelas: 'Muhammad Fikri Noor Fajri, S.Hum.' },

    // Kelas 5
    '5A': { name: 'Ustadz Wildan Faalul Abror', email: 'wildanabror00@gmail.com', number: '6281233318388', waliKelas: 'H. Misbachul Munir, Lc.' },
    '5B': { name: 'Ustadz Rahmat Khoirul Anwar, S.Psi.', email: 'rahmatkhoirulanwar23@gmail.com', number: '6285335241954', waliKelas: 'Arif Al Fatah, M.Sc.' },
    '5C': { name: 'Ustadz Muhammad Rafi Feriansyah', email: '', number: '62881025797090', waliKelas: 'Rohandi Yusuf Batubara, S.Hum.' },
    '5D': { name: 'Ustadz Muhammad Syahrul Mubarok', email: 'm.syahrulmobar06@gmail.com', number: '6285236300512', waliKelas: 'Lutfi Ariyanto, S.Pd.' },
    '5E': { name: 'Ustadz Dymas Naufal El Fawaz', email: 'dymasn@muallimin.sch.id', number: '6285117732302', waliKelas: 'Munzilin, S.H.I., M.Pd.' },
    '5F': { name: 'Ustadz Layllan Dzikri Firmansyah', email: 'dzikrilayllan@gmail.com', number: '6285728503309', waliKelas: 'Ikhwanuddin, S.H.I., M.S.I.' },
    '5UPPERA': { name: 'Ustadz Muhammad Rafi', email: 'muhammadrafi2246@gmail.com', number: '6287894970695', waliKelas: 'Galang Putra Muhammady, S.Pd.' },
    '5UPPERB': { name: 'Ustadz Ammar Ghozi Al Farisi', email: 'ammarghozi12@gmail.com', number: '6285725915157' },
    '5UPPERC': { name: 'Ustadz Ubaidillah Syafiq Atqiya', email: 'ubay.syafiq03@gmail.com', number: '6281284985750' },

    // Kelas 6
    '6INTERNASIONAL': { name: 'Ustadz Ubaidillah Syafiq Atqiya', email: 'ubay.syafiq03@gmail.com', number: '6281284985750' },
    '6A': { name: 'Ustadz Habib Fajar Rohman', email: 'fajarrohman116@gmail.com', number: '6281246112790' },
    '6B': { name: 'Ustadz Muhammad Rafif Said, S.Pd.', email: 'rafifsaid77@gmail.com', number: '62895413221010' },
    '6C': { name: 'Ustadz Gilang Cahya Ghufroni', email: 'gilangcahya@muallimin.sch.id', number: '6285725379068' },
    '6D': { name: 'Ustadz Hilmy Muwafaq Adman', email: 'hilmyadman97@gmail.com', number: '6281217904326' },
    '6E': { name: 'Ustadz Aflah Naufal Nabiih', email: '', number: '6281952116819' },
    '6F': { name: 'Ustadz Muhammad Ilman Khanafi', email: 'ilmankhanafi@muallimin.sch.id', number: '62895706160907' },
    '6G': { name: 'Ustadz Tajulqayyim Royyan', email: 'tajulqayyim@muallimin.sch.id', number: '6281334991879' }
};

// Data Kontak Koordinator Musyrif (Resmi 2026)
export const koordinatorMusyrif = [
    { name: 'Ustadz Andi Aqillah Fadia Haswat, S.A.P.', email: 'andiaqillahfadiahaswat@gmail.com', number: '6285339213109' },
    { name: 'Ustadz Akmal Wildan Syifauddin, S.Pd.', email: 'akmalws@muallimin.sch.id', number: '6287788451221' }
];

// Data kontak Pamong Asrama (Resmi & Terkini 2026)
export const pamongList = [
    { name: 'Ustadz M. Ismail Marzuq, S.Sos.', email: 'izmaelpoenya04@gmail.com', number: '6285326693918' },
    { name: 'Ustadz Ariel Amarta Dzikrillah, S.Sos.', email: 'arilamarta@gmail.com', number: '6285848589328' },
    { name: 'Ustadz Rais Yudhistira, Lc.', email: 'raiscutis@gmail.com', altEmail: 'cutisrais@gmail.com', number: '6281399548580' },
    { name: 'Ustadz Muh. Ahnaf Lubab, M.Pd.', email: 'ahnaflubab@muallimin.sch.id', number: '6285779006160' }
];

// Default Pamong Asrama Rujukan
export const pamongData = pamongList[3]; // Ustadz Muh. Ahnaf Lubab, M.Pd.
