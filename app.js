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

// 1. كود صفحة الراكب
const passengerForm = document.getElementById('passengerForm');
if (passengerForm) {
    document.getElementById('btnGps').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                document.getElementById('pLocation').value = link;
                alert("تم تحديد موقعك بنجاح!");
            });
        }
    });

    passengerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('pName').value;
        const location = document.getElementById('pLocation').value;

        push(ref(db, 'passengers'), {
            name: name,
            locationLink: location,
            timestamp: Date.now()
        }).then(() => {
            alert("تم إرسال البيانات للسائق!");
            passengerForm.reset();
        }).catch((err) => {
            alert("حدث خطأ: " + err.message);
        });
    });
}

// 2. كود لوحة السائق
const passengerList = document.getElementById('passengerList');
if (passengerList) {
    const map = L.map('map').setView([30.0444, 31.2357], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let markers = [];

    const passengersRef = ref(db, 'passengers');
    onValue(passengersRef, (snapshot) => {
        passengerList.innerHTML = '';
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        const data = snapshot.val();
        let count = 0;

        if (data) {
            Object.keys(data).forEach((key) => {
                count++;
                const item = data[key];
                const coordsMatch = item.locationLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                
                const card = document.createElement('div');
                card.className = 'passenger-card';
                card.dataset.id = key;
                card.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        <span class="drag-handle">⠿</span>
                        <div>
                            <div class="info-text">${item.name}</div>
                            <div class="sub-text"><a href="${item.locationLink}" target="_blank">رابط العنوان</a></div>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deletePassenger('${key}')">مسح</button>
                `;
                passengerList.appendChild(card);

                if (coordsMatch) {
                    const lat = parseFloat(coordsMatch[1]);
                    const lng = parseFloat(coordsMatch[2]);
                    const marker = L.marker([lat, lng]).addTo(map).bindPopup(item.name);
                    markers.push(marker);
                }
            });
        }
        document.getElementById('pCount').innerText = count;
    });

    if (typeof Sortable !== 'undefined') {
        Sortable.create(passengerList, { handle: '.drag-handle', animation: 150 });
    }

    document.getElementById('btnQR').addEventListener('click', () => {
        const modal = document.getElementById('qrModal');
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        const passengerUrl = window.location.href.replace('index.html', 'passenger.html');
        new QRCode(qrContainer, passengerUrl);
        modal.style.display = 'flex';
    });

    document.getElementById('btnCloseQR').addEventListener('click', () => {
        document.getElementById('qrModal').style.display = 'none';
    });
}

window.deletePassenger = function(id) {
    remove(ref(db, `passengers/${id}`));
};