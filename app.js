// استيراد مكتبات Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
    apiKey: "AIzaSyA87OpSlrcoOt_xo3wi492GME0HuJk8E_4",
    authDomain: "black-knights-5c5a8.firebaseapp.com",
    databaseURL: "https://black-knights-5c5a8-default-rtdb.firebaseio.com",
    projectId: "black-knights-5c5a8",
    storageBucket: "black-knights-5c5a8.firebasestorage.app",
    messagingSenderId: "699141823797",
    appId: "1:699141823797:web:11768011079d9701f0807c",
    measurementId: "G-JX743D3NH8"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -------------------------------------------------------------
// 2. كود لوحة تحكم السائق (index.html)
// -------------------------------------------------------------
if (document.getElementById("map")) {
    
    // إعداد الخريطة
    const map = L.map('map').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let markers = {};
    const passengerList = document.getElementById("passengerList");
    const pCount = document.getElementById("pCount");

    // الاستماع للتغييرات في قاعدة البيانات لعرض الركاب لحظياً
    const passengersRef = ref(db, 'passengers');
    onValue(passengersRef, (snapshot) => {
        passengerList.innerHTML = "";
        
        // مسح العلامات القديمة من الخريطة
        Object.values(markers).forEach(m => map.removeLayer(m));
        markers = {};

        const data = snapshot.val();
        if (data) {
            const entries = Object.entries(data);
            pCount.innerText = entries.length;

            entries.forEach(([id, p]) => {
                // إضافة الراكب للقائمة
                const card = document.createElement("div");
                card.className = "passenger-card";
                card.innerHTML = `
                    <div>
                        <div class="info-text">👤 ${p.name}</div>
                        <div class="sub-text">📍 ${p.address || "موقع محدد على الخريطة"}</div>
                    </div>
                    <button class="delete-btn" data-id="${id}">حذف</button>
                `;
                passengerList.appendChild(card);

                // إضافة ماركر على الخريطة لو متوفر إحداثيات
                if (p.lat && p.lng) {
                    const marker = L.marker([p.lat, p.lng]).addTo(map)
                        .bindPopup(`<b>${p.name}</b><br>${p.address || ''}`);
                    markers[id] = marker;
                }
            });

            // تفعيل أزرار الحذف
            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.onclick = (e) => {
                    const pId = e.target.getAttribute("data-id");
                    remove(ref(db, `passengers/${pId}`));
                };
            });
        } else {
            pCount.innerText = "0";
        }
    });

    // تفعيل ترتيب القائمة بالـ Drag & Drop
    if (passengerList) {
        new Sortable(passengerList, {
            animation: 150
        });
    }

    // --- توليد QR Code المخصص لصفحة الراكب فقط ---
    const btnQR = document.getElementById("btnQR");
    const qrModal = document.getElementById("qrModal");
    const btnCloseQR = document.getElementById("btnCloseQR");

    btnQR.onclick = () => {
        // تحديد رابط صفحة الراكب أونلاين فقط
        const baseUrl = window.location.href.split('index.html')[0].split('?')[0];
        const passengerUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'passenger.html';

        // تفريغ المكان وتوليد الـ QR
        document.getElementById("qrcode").innerHTML = "";
        new QRCode(document.getElementById("qrcode"), {
            text: passengerUrl,
            width: 200,
            height: 200
        });

        qrModal.style.display = "flex";
    };

    btnCloseQR.onclick = () => {
        qrModal.style.display = "none";
    };
}

// -------------------------------------------------------------
// 3. كود صفحة الراكب (passenger.html)
// -------------------------------------------------------------
if (document.getElementById("passengerForm")) {
    const form = document.getElementById("passengerForm");
    
    // جلب موقع الراكب الجغرافي عند الفتح لو متاح
    let currentLat = null;
    let currentLng = null;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
        }, (err) => {
            console.log("لم يتم السماح بالوصول للموقع الجغرافي.");
        });
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById("pName").value;
        const address = document.getElementById("pAddress").value;

        if (name) {
            push(ref(db, 'passengers'), {
                name: name,
                address: address,
                lat: currentLat,
                lng: currentLng,
                timestamp: Date.now()
            }).then(() => {
                alert("تم تسجيل بياناتك بنجاح وسيتوجه السائق إليك!");
                form.reset();
            }).catch((err) => {
                alert("حدث خطأ أثناء التسجيل: " + err.message);
            });
        }
    };
}