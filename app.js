import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- لوحة التحكم (index.html) ---
if (document.getElementById("map")) {
    const map = L.map('map').setView([30.0444, 31.2357], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // إعادة رسم أبعاد الخريطة للتأكد من ظهورها وتفادي الشاشة السوداء
    setTimeout(() => { map.invalidateSize(); }, 500);

    let markers = {};
    const passengerList = document.getElementById("passengerList");
    const pCount = document.getElementById("pCount");

    const passengersRef = ref(db, 'passengers');
    onValue(passengersRef, (snapshot) => {
        passengerList.innerHTML = "";
        Object.values(markers).forEach(m => map.removeLayer(m));
        markers = {};

        const data = snapshot.val();
        if (data) {
            const entries = Object.entries(data);
            pCount.innerText = entries.length;

            entries.forEach(([id, p]) => {
                const card = document.createElement("div");
                card.className = "passenger-card";
                card.innerHTML = `
                    <div>
                        <div class="info-text">👤 ${p.name}</div>
                        <div class="sub-text">📍 ${p.address || "موقع جغرافي"}</div>
                    </div>
                    <button class="delete-btn" data-id="${id}">حذف</button>
                `;
                passengerList.appendChild(card);

                if (p.lat && p.lng) {
                    const marker = L.marker([p.lat, p.lng]).addTo(map)
                        .bindPopup(`<b>${p.name}</b><br>${p.address || ''}`);
                    markers[id] = marker;
                }
            });

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

    if (passengerList) {
        new Sortable(passengerList, { animation: 150 });
    }

    const btnQR = document.getElementById("btnQR");
    const qrModal = document.getElementById("qrModal");
    const btnCloseQR = document.getElementById("btnCloseQR");

    btnQR.onclick = () => {
        const baseUrl = window.location.href.split('index.html')[0].split('?')[0];
        const passengerUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'passenger.html';

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

// --- صفحة الراكب (passenger.html) ---
if (document.getElementById("passengerForm")) {
    const form = document.getElementById("passengerForm");
    const btnGetLocation = document.getElementById("btnGetLocation");
    const locationStatus = document.getElementById("locationStatus");
    
    let currentLat = null;
    let currentLng = null;

    if (btnGetLocation) {
        btnGetLocation.onclick = () => {
            if (navigator.geolocation) {
                locationStatus.innerText = "جاري تحديد موقعك...";
                navigator.geolocation.getCurrentPosition((pos) => {
                    currentLat = pos.coords.latitude;
                    currentLng = pos.coords.longitude;
                    locationStatus.innerText = "✅ تم تحديد موقعك بنجاح!";
                }, (err) => {
                    locationStatus.innerText = "❌ تعذر تحديد الموقع الجغرافي.";
                });
            } else {
                locationStatus.innerText = "❌ المتصفح لا يدعم التحديد التلقائي.";
            }
        };
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
                alert("تم إرسال بياناتك بنجاح للسائق!");
                form.reset();
                if(locationStatus) locationStatus.innerText = "";
            }).catch((err) => {
                alert("حدث خطأ أثناء الإرسال: " + err.message);
            });
        }
    };
}