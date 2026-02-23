
    (function() {
        // ----- SETUP CANVAS -----
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const width = 1000, height = 450;

        // ----- GLOBAL STATE -----
        let gameRunning = true;
        let animationFrame = null;
        let gameOver = false;  
        
        // Player properties
        let player = {
            x: 200,
            y: 300,         // akan disesuaikan dengan platform
            vy: 0,
            vx: 0,
            width: 40,
            height: 48,
            icon: '🐰',
            onGround: false
        };
        
        let lives = 6;
        let score = 0;
        let cameraX = 0;           // scroll kamera mengikuti player
        let frame = 0; 
        let lastSpawnFrame = 0; // <-- TAMBAHKAN INI
        let spawnCooldown = 0;  // <-- TAMBAHKAN INI

        // penyimpanan lokal highscore
        let currentAccount = 'Adzkiya';
        let highscoreMap = new Map();
        let loveHighscoreMap = new Map(); // untuk love score
        loadHighscoreFromStorage();

        // ----- PLATFORM (blok yang bisa dinaiki) -----

        let platforms = [
            // tanah dasar diperpanjang sampai 6000
            { x: 0, y: 380, w: 6000, h: 30, type: 'ground' },
            
            // Zona 1 (0-1500) - platform awal yang mudah
            { x: 450, y: 300, w: 120, h: 20, type: 'platform' },
            { x: 750, y: 220, w: 100, h: 20, type: 'platform' },
            { x: 1050, y: 280, w: 150, h: 20, type: 'platform' },
            { x: 1400, y: 180, w: 130, h: 20, type: 'platform' },
            
            // Zona 2 (1500-2500) - platform lebih tinggi dan menantang
            { x: 1650, y: 250, w: 120, h: 20, type: 'platform' },
            { x: 1900, y: 200, w: 100, h: 20, type: 'platform' },
            { x: 2100, y: 150, w: 150, h: 20, type: 'platform' }, // platform tinggi
            { x: 2350, y: 280, w: 130, h: 20, type: 'platform' },
            { x: 2600, y: 320, w: 120, h: 20, type: 'platform' },
            
            // Zona 3 (2500-3500) - platform bertingkat
            { x: 2750, y: 250, w: 100, h: 20, type: 'platform' },
            { x: 2950, y: 180, w: 120, h: 20, type: 'platform' },
            { x: 3150, y: 120, w: 140, h: 20, type: 'platform' }, // platform sangat tinggi
            { x: 3400, y: 200, w: 130, h: 20, type: 'platform' },
            { x: 3600, y: 300, w: 150, h: 20, type: 'platform' },
            
            // Zona 4 (3500-4500) - platform berundak
            { x: 3750, y: 280, w: 120, h: 20, type: 'platform' },
            { x: 3950, y: 220, w: 100, h: 20, type: 'platform' },
            { x: 4100, y: 160, w: 130, h: 20, type: 'platform' },
            { x: 4300, y: 100, w: 120, h: 20, type: 'platform' }, // platform tertinggi
            { x: 4500, y: 180, w: 140, h: 20, type: 'platform' },
            
            // Zona 5 (4500-5500) - platform area akhir
            { x: 4650, y: 250, w: 150, h: 20, type: 'platform' },
            { x: 4850, y: 200, w: 120, h: 20, type: 'platform' },
            { x: 5050, y: 150, w: 130, h: 20, type: 'platform' },
            { x: 5250, y: 220, w: 140, h: 20, type: 'platform' },
            { x: 5450, y: 280, w: 120, h: 20, type: 'platform' },
            { x: 5650, y: 320, w: 150, h: 20, type: 'platform' },
            
            // Platform rahasia di atas (akses sulit)
            { x: 4000, y: 50, w: 200, h: 20, type: 'platform' }, // platform rahasia
            { x: 5000, y: 30, w: 150, h: 20, type: 'platform' }, // platform awan
        ];


        // musuh & rintangan (bergerak atau diam)
        let enemies = [
            // Zona 1
            { x: 600, y: 350, w: 40, h: 40, icon: '🐗', vx: -1, type: 'walker' },
            { x: 1200, y: 390, w: 40, h: 40, icon: '🐊', vx: 1, type: 'walker' },
            
            // Zona 2
            { x: 1700, y: 220, w: 40, h: 40, icon: '🦂', vx: 0, type: 'static' },
            { x: 2000, y: 170, w: 40, h: 40, icon: '🐍', vx: -1.2, type: 'walker' },
            { x: 2400, y: 250, w: 40, h: 40, icon: '🦎', vx: 0.8, type: 'walker' },
            
            // Zona 3
            { x: 2800, y: 220, w: 40, h: 40, icon: '🐗', vx: -1.5, type: 'walker' },
            { x: 3100, y: 90, w: 40, h: 40, icon: '🦅', vx: 1.2, type: 'walker' }, // musuh di platform tinggi
            { x: 3400, y: 170, w: 40, h: 40, icon: '🐊', vx: -1, type: 'walker' },
            
            // Zona 4
            { x: 3800, y: 250, w: 40, h: 40, icon: '🦂', vx: 0, type: 'static' },
            { x: 4000, y: 130, w: 40, h: 40, icon: '🐍', vx: 1.5, type: 'walker' },
            { x: 4300, y: 70, w: 40, h: 40, icon: '🦇', vx: -1.8, type: 'walker' }, // musuh cepat di platform rahasia
            
            // Zona 5
            { x: 4700, y: 220, w: 40, h: 40, icon: '🐗', vx: 1, type: 'walker' },
            { x: 5000, y: 0, w: 40, h: 40, icon: '🦉', vx: -1, type: 'walker' }, // musuh di platform awan
            { x: 5300, y: 190, w: 40, h: 40, icon: '🐊', vx: 0.9, type: 'walker' },
            { x: 5600, y: 290, w: 40, h: 40, icon: '🦎', vx: -1.2, type: 'walker' },
            
            // Bos area di ujung
            { x: 5900, y: 350, w: 60, h: 60, icon: '🐉', vx: 2.5, type: 'walker' }, // musuh besar dan cepat
        ];

                // LOVE SYSTEM
        let loves = []; // maksimal 2 love
        const MAX_LOVE = 1;
        let loveScore = 0; // poin khusus dari love
        
        // AUDIO (menggunakan Web Audio API karena tidak boleh autoplay)
        let audioCtx = null;
        let soundEnabled = true;


        // quiz state
        let quizActive = false;
        let currentQuiz = null;
        let quizTimer = null;
        const QUIZ_INTERVAL = 30000; 
        let extraLifeAwarded = false;
        let collisionCooldown = 0;  // agar tidak kena musuh terus
        let timeUntilNextQuiz = 30;


          // ----- FUNGSI TIMER QUIZ OTOMATIS -----
        function startQuizTimer() {
            // Hapus timer lama jika ada
            if (quizTimer) {
                clearInterval(quizTimer);
            }
            
            // Buat timer baru
            quizTimer = setInterval(() => {
                // Hanya munculkan quiz jika game sedang berjalan dan tidak sedang dalam quiz
                if (gameRunning && !quizActive && !gameOver && lives > 0) {
                    showQuiz();
                }
            }, QUIZ_INTERVAL);
        }
        
        function stopQuizTimer() {
            if (quizTimer) {
                clearInterval(quizTimer);
                quizTimer = null;
            }
        }


                // ----- AUDIO EFFECTS (sederhana dengan Web Audio) -----
        function initAudio() {
            if (audioCtx) return;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                console.log("Web Audio not supported");
            }
        }

        function playSound(type) {
            if (!audioCtx || !soundEnabled) return;
            
            // Resume audio context jika suspended (karena autoplay policy)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            switch(type) {
                case 'jump':
                    osc.frequency.value = 520;
                    gainNode.gain.value = 0.1;
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.1);
                    break;
                case 'love':
                    osc.frequency.value = 780;
                    gainNode.gain.value = 0.15;
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.15);
                    
                    // harmonic kedua
                    const osc2 = audioCtx.createOscillator();
                    osc2.connect(gainNode);
                    osc2.frequency.value = 1040;
                    osc2.start();
                    osc2.stop(audioCtx.currentTime + 0.1);
                    break;
                case 'hurt':
                    osc.frequency.value = 220;
                    gainNode.gain.value = 0.2;
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.2);
                    break;
                case 'correct':
                    // chord happy
                    osc.frequency.value = 660;
                    gainNode.gain.value = 0.15;
                    osc.start();
                    
                    const osc3 = audioCtx.createOscillator();
                    osc3.connect(gainNode);
                    osc3.frequency.value = 880;
                    osc3.start();
                    
                    setTimeout(() => {
                        osc.stop();
                        osc3.stop();
                    }, 200);
                    break;
                case 'wrong':
                    osc.frequency.value = 150;
                    gainNode.gain.value = 0.2;
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.3);
                    break;
            }
        }


                // ----- LOVE SYSTEM FUNCTIONS -----
        function spawnLove() {
            if (loves.length >= MAX_LOVE) return;
            if (!gameRunning || quizActive) return;
            
            // Tentukan posisi random di sekitar player (tapi tidak terlalu dekat)
            let minX = Math.max(0, player.x - 3000);
            let maxX = Math.min(5900, player.x + 600); // batas peta 5900 (kurangi sedikit)
            
            let attempts = 0;
            let placed = false;
            
            while (!placed && attempts < 50) {
                let x = minX + Math.random() * (maxX - minX);
                let y = 200 + Math.random() * 180; // ketinggian bervariasi
                
                // Cek apakah terlalu dekat dengan love lain
                let tooClose = false;
                for (let love of loves) {
                    if (Math.abs(love.x - x) < 2000) {
                        tooClose = true;
                        break;
                    }
                }
                
                // Cek apakah posisi di atas platform (agar tidak melayang)
                let onPlatform = false;
                for (let pl of platforms) {
                    if (x > pl.x && x < pl.x + pl.w && 
                        Math.abs(y - (pl.y - 30)) < 50) {
                        onPlatform = true;
                        y = pl.y - 40; // letakkan di atas platform
                        break;
                    }
                }
                
                if (!tooClose && (onPlatform || y > 350)) {
                    loves.push({
                        x: x,
                        y: y,
                        width: 30,
                        height: 30,
                        icon: '❤️',
                        collected: false
                    });
                    placed = true;
                }
                attempts++;
            }
            
            // Fallback: tempatkan di ground
            if (!placed) {
                loves.push({
                    x: player.x + (Math.random() > 0.5 ? 300 : -300),
                    y: 350,
                    width: 30,
                    height: 30,
                    icon: '❤️',
                    collected: false
                });
            }
        }

        function checkLoveCollision() {
            if (!gameRunning || quizActive) return;
            for (let i = loves.length - 1; i >= 0; i--) {
                let love = loves[i];
                
                if (player.x + player.width > love.x &&
                    player.x < love.x + love.width &&
                    player.y + player.height > love.y &&
                    player.y < love.y + love.height) {
                    
                    // Love terambil
                    loves.splice(i, 1);
                    loveScore += 10;
                    score += 10; // tambah ke total score
                    playSound('love');
                    
                    // Update tampilan score
                    document.getElementById('scoreDisplay').innerText = `🏁 ${Math.floor(score/10)} ✨${loveScore}`;

                    updateHighscoreDisplay();
                    
                    // Cek apakah loveScore sudah memecahkan rekor
                    const currentLoveHigh = loveHighscoreMap.get(currentAccount) || 0;
                    if (loveScore > currentLoveHigh) {
                        // Tampilkan notifikasi kecil (opsional)
                        showLoveHighscoreNotification();
                    }
                    
                    
                    // Spawn love baru setelah delay
                    setTimeout(() => {
                        if (gameRunning && !quizActive) {
                            spawnLove();
                        }
                    }, 500);

                    if (gameRunning && !quizActive && loves.length < MAX_LOVE) {
                            setTimeout(() => {
                                spawnLove();
                            }, 300);
                        }
                }
            }
        }

                // Fungsi untuk menampilkan notifikasi love highscore baru
        function showLoveHighscoreNotification() {
            // Buat elemen notifikasi sementara
            const notif = document.createElement('div');
            notif.innerText = '🏆 LOVE HIGHSCORE BARU! 🏆';
            notif.style.position = 'fixed';
            notif.style.top = '50%';
            notif.style.left = '50%';
            notif.style.transform = 'translate(-50%, -50%)';
            notif.style.backgroundColor = '#ffd966';
            notif.style.color = '#8b4513';
            notif.style.padding = '20px 40px';
            notif.style.borderRadius = '50px';
            notif.style.fontSize = '2rem';
            notif.style.fontWeight = 'bold';
            notif.style.border = '5px solid #e1972e';
            notif.style.boxShadow = '0 10px 0 #8f5820';
            notif.style.zIndex = '2000';
            notif.style.animation = 'modalPop 0.3s ease-out';
            
            document.body.appendChild(notif);
            
            setTimeout(() => {
                notif.remove();
            }, 2000);
        }



        // ----- HIGHSCORE LOKAL -----
        function loadHighscoreFromStorage() {
            try {
                // Load regular score
                const stored = localStorage.getItem('jungleHopHighscoresV2');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    highscoreMap = new Map(Object.entries(parsed));
                }
                
                // Load love score
                const loveStored = localStorage.getItem('jungleHopLoveHighscoresV2');
                if (loveStored) {
                    const loveParsed = JSON.parse(loveStored);
                    loveHighscoreMap = new Map(Object.entries(loveParsed));
                }
            } catch (e) {}
            updateHighscoreDisplay();
        }

        function saveHighscoreToStorage() {
            // Save regular score
            const obj = Object.fromEntries(highscoreMap);
            localStorage.setItem('jungleHopHighscoresV2', JSON.stringify(obj));
            
            // Save love score
            const loveObj = Object.fromEntries(loveHighscoreMap);
            localStorage.setItem('jungleHopLoveHighscoresV2', JSON.stringify(loveObj));
        }

        function updateHighscoreForAccount(account, newScore) {
            const currentHigh = highscoreMap.get(account) || 0;
            if (newScore > currentHigh) {
                highscoreMap.set(account, newScore);
                saveHighscoreToStorage();
            }
            updateHighscoreDisplay();
        }

        function updateLoveHighscoreForAccount(account, newLoveScore) {
            const currentLoveHigh = loveHighscoreMap.get(account) || 0;
            if (newLoveScore > currentLoveHigh) {
                loveHighscoreMap.set(account, newLoveScore);
                saveHighscoreToStorage();
            }
            updateHighscoreDisplay();
        }

        function updateHighscoreDisplay() {
            const high = highscoreMap.get(currentAccount) || 0;
            const loveHigh = loveHighscoreMap.get(currentAccount) || 0;
            
            // Tampilkan kedua highscore
            document.getElementById('highscoreValue').innerHTML = 
                `🏁 ${high} <span style="font-size:1rem; margin-left:10px;">❤️ ${loveHigh}</span>`;
        }

        // ----- IKON & INPUT AKUN -----
        const playerNameInput = document.getElementById('playerNameInput');
        const iconSpans = document.querySelectorAll('.icon-option');
        let selectedIcon = '🐰';

        iconSpans.forEach(span => {
            span.addEventListener('click', () => {
                iconSpans.forEach(s => s.classList.remove('selected'));
                span.classList.add('selected');
                selectedIcon = span.getAttribute('data-icon');
                player.icon = selectedIcon;
            });
        });

        playerNameInput.addEventListener('input', (e) => {
            let newName = e.target.value.trim();
            if (newName === '') newName = 'Adzkiya';
            currentAccount = newName;
            updateHighscoreDisplay();
        });

        // ----- QUIZ DATABASE -----
                // ----- QUIZ DATABASE SUPER LENGKAP -----
        const quizDB = [
            // === HEWAN (20 soal) ===
            { question: '🐶 Bahasa Inggris "anjing" ?', options: ['Cat', 'Dog', 'Bird', 'Fish'], correct: 'Dog' },
            { question: '🐱 Bahasa Inggris "kucing" ?', options: ['Cat', 'Rat', 'Frog', 'Rabbit'], correct: 'Cat' },
            { question: '🐭 Bahasa Inggris "tikus" ?', options: ['Mouse', 'Rat', 'Hamster', 'Squirrel'], correct: 'Mouse' },
            { question: '🐹 Bahasa Inggris "hamster" ?', options: ['Hamster', 'Gerbil', 'Guinea Pig', 'Mouse'], correct: 'Hamster' },
            { question: '🐰 Bahasa Inggris "kelinci" ?', options: ['Rabbit', 'Hare', 'Bunny', 'Chinchilla'], correct: 'Rabbit' },
            { question: '🦊 Bahasa Inggris "rubah" ?', options: ['Fox', 'Wolf', 'Coyote', 'Jackal'], correct: 'Fox' },
            { question: '🐻 Bahasa Inggris "beruang" ?', options: ['Bear', 'Polar Bear', 'Brown Bear', 'Grizzly'], correct: 'Bear' },
            { question: '🐼 Bahasa Inggris "panda" ?', options: ['Panda', 'Red Panda', 'Bear', 'Raccoon'], correct: 'Panda' },
            { question: '🐨 Bahasa Inggris "koala" ?', options: ['Koala', 'Sloth', 'Wombat', 'Kangaroo'], correct: 'Koala' },
            { question: '🐯 Bahasa Inggris "harimau" ?', options: ['Tiger', 'Lion', 'Leopard', 'Cheetah'], correct: 'Tiger' },
            { question: '🦁 Bahasa Inggris "singa" ?', options: ['Lion', 'Tiger', 'Leopard', 'Jaguar'], correct: 'Lion' },
            { question: '🐮 Bahasa Inggris "sapi" ?', options: ['Cow', 'Bull', 'Ox', 'Calf'], correct: 'Cow' },
            { question: '🐷 Bahasa Inggris "babi" ?', options: ['Pig', 'Boar', 'Hog', 'Swine'], correct: 'Pig' },
            { question: '🐸 Bahasa Inggris "katak" ?', options: ['Frog', 'Toad', 'Crocodile', 'Snake'], correct: 'Frog' },
            { question: '🐵 Bahasa Inggris "monyet" ?', options: ['Monkey', 'Ape', 'Gorilla', 'Chimpanzee'], correct: 'Monkey' },
            { question: '🐔 Bahasa Inggris "ayam" ?', options: ['Chicken', 'Hen', 'Rooster', 'Duck'], correct: 'Chicken' },
            { question: '🐧 Bahasa Inggris "pinguin" ?', options: ['Penguin', 'Puffin', 'Seal', 'Walrus'], correct: 'Penguin' },
            { question: '🐦 Bahasa Inggris "burung" ?', options: ['Bird', 'Sparrow', 'Eagle', 'Hawk'], correct: 'Bird' },
            { question: '🐤 Bahasa Inggris "anak ayam" ?', options: ['Chick', 'Duckling', 'Chicken', 'Crow'], correct: 'Chick' },
            { question: '🐌 Bahasa Inggris "siput" ?', options: ['Snail', 'Slug', 'Worm', 'Caterpillar'], correct: 'Snail' },
            
            // === BUAH (20 soal) ===
            { question: '🍎 Bahasa Inggris "apel" ?', options: ['Apple', 'Grape', 'Orange', 'Mango'], correct: 'Apple' },
            { question: '🍐 Bahasa Inggris "pir" ?', options: ['Pear', 'Apple', 'Peach', 'Plum'], correct: 'Pear' },
            { question: '🍊 Bahasa Inggris "jeruk" ?', options: ['Orange', 'Lemon', 'Lime', 'Grapefruit'], correct: 'Orange' },
            { question: '🍋 Bahasa Inggris "lemon" ?', options: ['Lemon', 'Lime', 'Orange', 'Grapefruit'], correct: 'Lemon' },
            { question: '🍌 Bahasa Inggris "pisang" ?', options: ['Banana', 'Plantain', 'Papaya', 'Mango'], correct: 'Banana' },
            { question: '🍉 Bahasa Inggris "semangka" ?', options: ['Watermelon', 'Melon', 'Honeydew', 'Cantaloupe'], correct: 'Watermelon' },
            { question: '🍇 Bahasa Inggris "anggur" ?', options: ['Grape', 'Berry', 'Currant', 'Raisin'], correct: 'Grape' },
            { question: '🍓 Bahasa Inggris "stroberi" ?', options: ['Strawberry', 'Raspberry', 'Blueberry', 'Blackberry'], correct: 'Strawberry' },
            { question: '🫐 Bahasa Inggris "blueberry" ?', options: ['Blueberry', 'Strawberry', 'Raspberry', 'Blackberry'], correct: 'Blueberry' },
            { question: '🍒 Bahasa Inggris "ceri" ?', options: ['Cherry', 'Cranberry', 'Raspberry', 'Plum'], correct: 'Cherry' },
            { question: '🍑 Bahasa Inggris "persik" ?', options: ['Peach', 'Plum', 'Nectarine', 'Apricot'], correct: 'Peach' },
            { question: '🥭 Bahasa Inggris "mangga" ?', options: ['Mango', 'Papaya', 'Pineapple', 'Guava'], correct: 'Mango' },
            { question: '🍍 Bahasa Inggris "nanas" ?', options: ['Pineapple', 'Mango', 'Papaya', 'Coconut'], correct: 'Pineapple' },
            { question: '🥥 Bahasa Inggris "kelapa" ?', options: ['Coconut', 'Pineapple', 'Mango', 'Banana'], correct: 'Coconut' },
            { question: '🥝 Bahasa Inggris "kiwi" ?', options: ['Kiwi', 'Kiwifruit', 'Melon', 'Lemon'], correct: 'Kiwi' },
            { question: '🍅 Bahasa Inggris "tomat" ?', options: ['Tomato', 'Potato', 'Eggplant', 'Pepper'], correct: 'Tomato' },
            { question: '🍆 Bahasa Inggris "terong" ?', options: ['Eggplant', 'Zucchini', 'Cucumber', 'Squash'], correct: 'Eggplant' },
            { question: '🥑 Bahasa Inggris "alpukat" ?', options: ['Avocado', 'Guava', 'Papaya', 'Mango'], correct: 'Avocado' },
            { question: '🌶️ Bahasa Inggris "cabe" ?', options: ['Chili', 'Pepper', 'Paprika', 'Cayenne'], correct: 'Chili' },
            { question: '🥕 Bahasa Inggris "wortel" ?', options: ['Carrot', 'Radish', 'Potato', 'Turnip'], correct: 'Carrot' },
            
            // === BENDA (20 soal) ===
            { question: '📖 Bahasa Inggris "buku" ?', options: ['Book', 'Notebook', 'Magazine', 'Novel'], correct: 'Book' },
            { question: '✏️ Bahasa Inggris "pensil" ?', options: ['Pencil', 'Pen', 'Marker', 'Crayon'], correct: 'Pencil' },
            { question: '🖊️ Bahasa Inggris "pulpen" ?', options: ['Pen', 'Pencil', 'Marker', 'Brush'], correct: 'Pen' },
            { question: '📏 Bahasa Inggris "penggaris" ?', options: ['Ruler', 'Meter', 'Scale', 'Tape'], correct: 'Ruler' },
            { question: '📚 Bahasa Inggris "buku-buku" ?', options: ['Books', 'Book', 'Library', 'Shelf'], correct: 'Books' },
            { question: '📓 Bahasa Inggris "buku catatan" ?', options: ['Notebook', 'Book', 'Diary', 'Journal'], correct: 'Notebook' },
            { question: '📒 Bahasa Inggris "buku tulis" ?', options: ['Notebook', 'Textbook', 'Workbook', 'Copybook'], correct: 'Notebook' },
            { question: '📃 Bahasa Inggris "kertas" ?', options: ['Paper', 'Document', 'Sheet', 'Page'], correct: 'Paper' },
            { question: '✂️ Bahasa Inggris "gunting" ?', options: ['Scissors', 'Cutter', 'Knife', 'Shears'], correct: 'Scissors' },
            { question: '📌 Bahasa Inggris "paku payung" ?', options: ['Pin', 'Nail', 'Tack', 'Staple'], correct: 'Pin' },
            { question: '📎 Bahasa Inggris "klip kertas" ?', options: ['Paperclip', 'Staple', 'Pin', 'Clip'], correct: 'Paperclip' },
            { question: '🔒 Bahasa Inggris "gembok" ?', options: ['Lock', 'Key', 'Padlock', 'Chain'], correct: 'Lock' },
            { question: '🔑 Bahasa Inggris "kunci" ?', options: ['Key', 'Lock', 'Handle', 'Knob'], correct: 'Key' },
            { question: '🔨 Bahasa Inggris "palu" ?', options: ['Hammer', 'Mallet', 'Tool', 'Wrench'], correct: 'Hammer' },
            { question: '🪓 Bahasa Inggris "kapak" ?', options: ['Axe', 'Hatchet', 'Saw', 'Chisel'], correct: 'Axe' },
            { question: '🔧 Bahasa Inggris "kunci inggris" ?', options: ['Wrench', 'Spanner', 'Tool', 'Pliers'], correct: 'Wrench' },
            { question: '🔪 Bahasa Inggris "pisau" ?', options: ['Knife', 'Blade', 'Sword', 'Cutter'], correct: 'Knife' },
            { question: '🚪 Bahasa Inggris "pintu" ?', options: ['Door', 'Gate', 'Entrance', 'Exit'], correct: 'Door' },
            { question: '🪑 Bahasa Inggris "kursi" ?', options: ['Chair', 'Seat', 'Stool', 'Bench'], correct: 'Chair' },
            { question: '🛏️ Bahasa Inggris "tempat tidur" ?', options: ['Bed', 'Mattress', 'Couch', 'Sofa'], correct: 'Bed' },
            
            // === WARNA (15 soal) ===
            { question: '🔴 Bahasa Inggris "merah" ?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 'Red' },
            { question: '🟠 Bahasa Inggris "jingga" ?', options: ['Orange', 'Red', 'Yellow', 'Brown'], correct: 'Orange' },
            { question: '🟡 Bahasa Inggris "kuning" ?', options: ['Yellow', 'Gold', 'Orange', 'Lemon'], correct: 'Yellow' },
            { question: '🟢 Bahasa Inggris "hijau" ?', options: ['Green', 'Blue', 'Teal', 'Olive'], correct: 'Green' },
            { question: '🔵 Bahasa Inggris "biru" ?', options: ['Blue', 'Navy', 'Cyan', 'Indigo'], correct: 'Blue' },
            { question: '🟣 Bahasa Inggris "ungu" ?', options: ['Purple', 'Violet', 'Lavender', 'Magenta'], correct: 'Purple' },
            { question: '🟤 Bahasa Inggris "coklat" ?', options: ['Brown', 'Beige', 'Tan', 'Coffee'], correct: 'Brown' },
            { question: '⚫ Bahasa Inggris "hitam" ?', options: ['Black', 'Dark', 'Charcoal', 'Ebony'], correct: 'Black' },
            { question: '⚪ Bahasa Inggris "putih" ?', options: ['White', 'Snow', 'Cream', 'Ivory'], correct: 'White' },
            { question: '🩷 Bahasa Inggris "merah muda" ?', options: ['Pink', 'Rose', 'Magenta', 'Coral'], correct: 'Pink' },
            { question: '🩶 Bahasa Inggris "abu-abu" ?', options: ['Gray', 'Grey', 'Silver', 'Ash'], correct: 'Gray' },
            { question: '🤎 Bahasa Inggris "coklat tua" ?', options: ['Brown', 'Dark Brown', 'Chocolate', 'Coffee'], correct: 'Brown' },
            { question: '💜 Bahasa Inggris "ungu" ?', options: ['Purple', 'Violet', 'Lavender', 'Lilac'], correct: 'Purple' },
            { question: '💙 Bahasa Inggris "biru" ?', options: ['Blue', 'Navy', 'Sky Blue', 'Azure'], correct: 'Blue' },
            { question: '💚 Bahasa Inggris "hijau" ?', options: ['Green', 'Lime', 'Emerald', 'Mint'], correct: 'Green' },
            
            // === TRANSPORTASI (15 soal) ===
            { question: '🚗 Bahasa Inggris "mobil" ?', options: ['Car', 'Van', 'Truck', 'Bus'], correct: 'Car' },
            { question: '🚕 Bahasa Inggris "taksi" ?', options: ['Taxi', 'Cab', 'Car', 'Van'], correct: 'Taxi' },
            { question: '🚌 Bahasa Inggris "bus" ?', options: ['Bus', 'Van', 'Truck', 'Minibus'], correct: 'Bus' },
            { question: '🚎 Bahasa Inggris "bus listrik" ?', options: ['Trolleybus', 'Bus', 'Tram', 'Train'], correct: 'Trolleybus' },
            { question: '🚓 Bahasa Inggris "mobil polisi" ?', options: ['Police Car', 'Patrol Car', 'Cruiser', 'Squad Car'], correct: 'Police Car' },
            { question: '🚑 Bahasa Inggris "ambulans" ?', options: ['Ambulance', 'Medical Van', 'Rescue', 'Emergency'], correct: 'Ambulance' },
            { question: '🚒 Bahasa Inggris "mobil pemadam" ?', options: ['Fire Truck', 'Fire Engine', 'Firefighter', 'Pumper'], correct: 'Fire Truck' },
            { question: '🚚 Bahasa Inggris "truk" ?', options: ['Truck', 'Lorry', 'Van', 'Pickup'], correct: 'Truck' },
            { question: '🚲 Bahasa Inggris "sepeda" ?', options: ['Bicycle', 'Bike', 'Cycle', 'Scooter'], correct: 'Bicycle' },
            { question: '🛵 Bahasa Inggris "skuter" ?', options: ['Scooter', 'Moped', 'Motorcycle', 'Bike'], correct: 'Scooter' },
            { question: '🏍️ Bahasa Inggris "motor" ?', options: ['Motorcycle', 'Motorbike', 'Bike', 'Scooter'], correct: 'Motorcycle' },
            { question: '✈️ Bahasa Inggris "pesawat" ?', options: ['Airplane', 'Plane', 'Jet', 'Aircraft'], correct: 'Airplane' },
            { question: '🚁 Bahasa Inggris "helikopter" ?', options: ['Helicopter', 'Chopper', 'Copter', 'Gyrocopter'], correct: 'Helicopter' },
            { question: '🚀 Bahasa Inggris "roket" ?', options: ['Rocket', 'Spaceship', 'Missile', 'Shuttle'], correct: 'Rocket' },
            { question: '🚢 Bahasa Inggris "kapal" ?', options: ['Ship', 'Boat', 'Vessel', 'Ferry'], correct: 'Ship' },
            
            // === ANGKA (10 soal) ===
            { question: '1️⃣ Bahasa Inggris "satu" ?', options: ['One', 'Two', 'Three', 'Four'], correct: 'One' },
            { question: '2️⃣ Bahasa Inggris "dua" ?', options: ['Two', 'One', 'Three', 'Four'], correct: 'Two' },
            { question: '3️⃣ Bahasa Inggris "tiga" ?', options: ['Three', 'Two', 'Four', 'Five'], correct: 'Three' },
            { question: '4️⃣ Bahasa Inggris "empat" ?', options: ['Four', 'Three', 'Five', 'Six'], correct: 'Four' },
            { question: '5️⃣ Bahasa Inggris "lima" ?', options: ['Five', 'Four', 'Six', 'Seven'], correct: 'Five' },
            { question: '6️⃣ Bahasa Inggris "enam" ?', options: ['Six', 'Five', 'Seven', 'Eight'], correct: 'Six' },
            { question: '7️⃣ Bahasa Inggris "tujuh" ?', options: ['Seven', 'Six', 'Eight', 'Nine'], correct: 'Seven' },
            { question: '8️⃣ Bahasa Inggris "delapan" ?', options: ['Eight', 'Seven', 'Nine', 'Ten'], correct: 'Eight' },
            { question: '9️⃣ Bahasa Inggris "sembilan" ?', options: ['Nine', 'Eight', 'Ten', 'Eleven'], correct: 'Nine' },
            { question: '🔟 Bahasa Inggris "sepuluh" ?', options: ['Ten', 'Nine', 'Eleven', 'Twelve'], correct: 'Ten' },
            
            // === MAKANAN (10 soal) ===
            { question: '🍔 Bahasa Inggris "hamburger" ?', options: ['Hamburger', 'Burger', 'Sandwich', 'Hotdog'], correct: 'Hamburger' },
            { question: '🍟 Bahasa Inggris "kentang goreng" ?', options: ['French Fries', 'Chips', 'Fries', 'Potato Chips'], correct: 'French Fries' },
            { question: '🍕 Bahasa Inggris "pizza" ?', options: ['Pizza', 'Pasta', 'Spaghetti', 'Lasagna'], correct: 'Pizza' },
            { question: '🌭 Bahasa Inggris "hotdog" ?', options: ['Hotdog', 'Sausage', 'Frankfurter', 'Wiener'], correct: 'Hotdog' },
            { question: '🥪 Bahasa Inggris "sandwich" ?', options: ['Sandwich', 'Toast', 'Bread', 'Sub'], correct: 'Sandwich' },
            { question: '🍦 Bahasa Inggris "es krim" ?', options: ['Ice Cream', 'Gelato', 'Sorbet', 'Frozen Yogurt'], correct: 'Ice Cream' },
            { question: '🍩 Bahasa Inggris "donat" ?', options: ['Donut', 'Doughnut', 'Pastry', 'Bagel'], correct: 'Donut' },
            { question: '🍪 Bahasa Inggris "kue kering" ?', options: ['Cookie', 'Biscuit', 'Cracker', 'Cake'], correct: 'Cookie' },
            { question: '🍫 Bahasa Inggris "coklat" ?', options: ['Chocolate', 'Candy', 'Sweet', 'Cocoa'], correct: 'Chocolate' },
            { question: '🥛 Bahasa Inggris "susu" ?', options: ['Milk', 'Yogurt', 'Cream', 'Milkshake'], correct: 'Milk' }
        ];
        
        // Total soal: 110 soal
        console.log('Total soal:', quizDB.length); // Akan muncul 110 di console

        function getRandomQuiz() {
            // Ambil soal random
            const quiz = quizDB[Math.floor(Math.random() * quizDB.length)];
            
            // Acak urutan options (agar tidak selalu urutan yang sama)
            const shuffledOptions = [...quiz.options].sort(() => Math.random() - 0.5);
            
            return {
                ...quiz,
                options: shuffledOptions
            };
        }

        // ----- UI QUIZ -----        
        const quizModalOverlay = document.getElementById('quizModalOverlay');
        const modalQuizQuestion = document.getElementById('modalQuizQuestion');
        const modalQuizOptions = document.getElementById('modalQuizOptions');
        const modalFeedbackText = document.getElementById('modalFeedbackText');
        const modalResetBtn = document.getElementById('modalResetGameBtn');

        function showQuiz() {
            if (!gameRunning) return;
            initAudio();
            quizActive = true;
            extraLifeAwarded = false;

            const q = getRandomQuiz();
            currentQuiz = q;
            
            // Tampilkan modal
            modalQuizQuestion.innerText = q.question;
            modalQuizOptions.innerHTML = '';
            
            // Set feedback berdasarkan status game
            if (lives <= 0) {
                modalFeedbackText.innerText = '💔 GAME OVER. Jawab untuk reset?';
            } else {
                modalFeedbackText.innerText = 'Pilih jawaban untuk lanjut!';
            }
            
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.classList.add('option-btn');
                btn.innerText = opt;
                btn.onclick = () => handleQuizAnswer(opt);
                modalQuizOptions.appendChild(btn);
            });
            
            // Tampilkan overlay modal
            quizModalOverlay.style.display = 'flex';
        }

        function handleQuizAnswer(selected) {
            if (!quizActive || !currentQuiz) return;
            
            if (selected === currentQuiz.correct) {
                playSound('correct');
                if (!extraLifeAwarded && lives > 0) {
                    if (lives < 5){
                        lives++;
                    }
                    
                    extraLifeAwarded = true;
                }
                modalFeedbackText.innerText = '✅ Benar! +1 nyawa. Lanjut!';
                
                setTimeout(() => {
                    if (quizActive) {
                        quizActive = false;
                        currentQuiz = null;
                        quizModalOverlay.style.display = 'none';
                        
                        // Jika game over tapi jawab benar, reset game otomatis
                        if (gameOver) {
                            resetGame();
                        }
                    }
                }, 800);
            } else {
                playSound('wrong');
                
                // HUKUMAN: jawaban salah mengurangi 1 nyawa (hanya jika masih hidup)
                if (lives > 0) {
                    lives--;
                }
                
                if (lives < 0) lives = 0;
                updateLivesDisplay();
                
                if (lives <= 0) {
                    // GAME OVER
                    gameRunning = false;
                    gameOver = true;  // SET GAME OVER FLAG
                    stopQuizTimer();
                    modalFeedbackText.innerText = `❌ Salah. Jawaban: ${currentQuiz.correct}. GAME OVER!`;
                    
                    // Hentikan animation frame
                    if (animationFrame) {
                        cancelAnimationFrame(animationFrame);
                        animationFrame = null;
                    }
                    
                    // Modal tetap terbuka, user bisa reset
                } else {
                    modalFeedbackText.innerText = `❌ Salah. Jawaban: ${currentQuiz.correct}. Nyawa -1`;
                    
                    // Masih ada nyawa, tutup quiz setelah delay
                    setTimeout(() => {
                        if (quizActive) {
                            quizActive = false;
                            currentQuiz = null;
                            quizModalOverlay.style.display = 'none';
                        }
                    }, 1000);
                }
            }
        }
       

        // ----- FISIKA & KONTROL -----
        const GRAVITY = 0.5;
        const JUMP_FORCE = -12;
        const MOVE_SPEED = 4;
        const keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };

        window.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
            if (key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
            if (key === 'ArrowUp') { keys.up = true; e.preventDefault(); }
            if (key === 'ArrowDown') { keys.down = true; e.preventDefault(); }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key;
            if (key === 'ArrowLeft') { keys.left = false; e.preventDefault(); }
            if (key === 'ArrowRight') { keys.right = false; e.preventDefault(); }
            if (key === 'ArrowUp') { keys.up = false; e.preventDefault(); }
            if (key === 'ArrowDown') { keys.down = false; e.preventDefault(); }
        });

        function applyPlayerMovement() {
            if (quizActive || !gameRunning) return;

            // horizontal
            if (keys.left) player.vx = -MOVE_SPEED;
            else if (keys.right) player.vx = MOVE_SPEED;
            else player.vx *= 0.7; // gesekan

            // batas kecepatan
            if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
            if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;

            player.x += player.vx;

            // gravity & lompat
            player.vy += GRAVITY;
            if (keys.up && player.onGround) {
                player.vy = JUMP_FORCE;
                player.onGround = false;
                 playSound('jump');
            }
            player.y += player.vy;

            // platform collision
            player.onGround = false;
            for (let pl of platforms) {
                if (player.vy >= 0 && // jatuh ke bawah
                    player.x + player.width > pl.x &&
                    player.x < pl.x + pl.w &&
                    player.y + player.height > pl.y &&
                    player.y + player.height < pl.y + pl.h + 15) {
                    
                    player.y = pl.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                }
            }

            // batas bawah (kalau jatuh dari dunia)
            if (player.y > height + 200) {
                if (!quizActive && gameRunning) {
                    lives--;
                    if (lives < 0) lives = 0;
                    updateLivesDisplay();
                    if (lives > 0) {
                        resetPlayerPosition();
                        showQuiz();
                    } else {
                        gameRunning = false;
                        gameOver = true;  // SET GAME OVER
                        stopQuizTimer();
                        showQuiz();
                        
                        // Hentikan animation frame
                        if (animationFrame) {
                            cancelAnimationFrame(animationFrame);
                            animationFrame = null;
                        }
                    }
                }
            }

            // turun dari platform (tekan bawah)
            if (keys.down && player.onGround) {
                player.y += 20; // sedikit turun
                player.onGround = false;
            }

            // update kamera (ikuti player)
            cameraX = player.x - 400;
            if (cameraX < 0) cameraX = 0;
        }

        function resetPlayerPosition() {
            player.x = 200;
            player.y = 300;
            player.vy = 0;
            player.vx = 0;
        }

        // update musuh & collision
        
                // update musuh & collision
        function updateEnemies() {
            if (quizActive || !gameRunning || gameOver) return; // tambah gameOver

            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                if (e.type === 'walker') {
                    e.x += e.vx;
                    if (e.x < 200 || e.x > 5900) e.vx *= -1;
                }

                if (collisionCooldown <= 0) {
                    if (player.x + player.width > e.x &&
                        player.x < e.x + e.w &&
                        player.y + player.height > e.y &&
                        player.y < e.y + e.h) {
                        if (lives > 2){
                            lives--;
                        }                        

                        //if (lives < 0) lives = 0;
                        updateLivesDisplay();
                        collisionCooldown = 100;

                        if (lives > 0) {
                            playSound('hurt'); 
                            showQuiz();
                        } else {
                            // GAME OVER
                            gameRunning = false;
                            gameOver = true;  // SET GAME OVER
                            stopQuizTimer();
                            playSound('hurt'); 
                            showQuiz();
                            
                            // Hentikan animation frame
                            if (animationFrame) {
                                cancelAnimationFrame(animationFrame);
                                animationFrame = null;
                            }
                        }
                        break;
                    }
                }
            }
            if (collisionCooldown > 0) collisionCooldown--;
        }

        // ----- GAME LOOP DRAW -----
        function draw() {
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(-cameraX, 0);  // scroll kamera

            // langit gradien
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#c6e9ff');
            grad.addColorStop(0.7, '#a7d8c0');
            ctx.fillStyle = grad;
            ctx.fillRect(cameraX, 0, width + cameraX, height);

            // gambar platform
            platforms.forEach(p => {
                ctx.fillStyle = p.type === 'ground' ? '#7b5f3a' : '#a57c50';
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = '#4f3b1e';
                ctx.lineWidth = 3;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
                if (p.type === 'platform') {
                    ctx.fillStyle = '#6d8f5d';
                    ctx.fillRect(p.x + 5, p.y - 5, p.w - 10, 5);
                }
            });

            // gambar musuh
            enemies.forEach(e => {
                ctx.font = '46px "Segoe UI Emoji", "Apple Color Emoji"';
                ctx.fillText(e.icon, e.x, e.y + 35);
            });

                        // gambar love
            loves.forEach(love => {
                ctx.font = '40px "Segoe UI Emoji", "Apple Color Emoji"';
                ctx.fillText(love.icon, love.x, love.y + 30);
                
                // Efek berkilau (animasi sederhana)
                if (Math.sin(Date.now() * 0.005) > 0.5) {
                    ctx.shadowColor = 'gold';
                    ctx.shadowBlur = 15;
                    ctx.fillText('✨', love.x - 10, love.y);
                    ctx.shadowBlur = 0;
                }
            });

            // gambar player
            ctx.font = '58px "Segoe UI Emoji", "Apple Color Emoji"';
            ctx.fillText(player.icon, player.x, player.y + 45);

            ctx.restore();

            // overlay quiz
            if (quizActive) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(0, 0, width, height);
                ctx.font = 'bold 36px sans-serif';
                ctx.fillStyle = '#fff7b0';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 10;
                ctx.fillText('📋 JAWAB QUIZ', 300, 200);
                ctx.shadowBlur = 0;
            }
        }

        function gameLoop() {
            // HENTIKAN LOOP JIKA GAME OVER SUDAH BERHENTI
            if (gameOver) {
                // Tetap draw frame terakhir tapi jangan update
                draw();
                return; // STOP rekursi
            }
            
            if (!quizActive && gameRunning) {
                applyPlayerMovement();
                updateEnemies();
                
                // Spawn love dengan sistem cooldown
                if (loves.length < MAX_LOVE && spawnCooldown <= 0) {
                    if (Math.random() < 0.02) {
                        spawnLove();
                        spawnCooldown = 90;
                    }
                }
                if (spawnCooldown > 0) spawnCooldown--;
                
                // Cek collision dengan love
                checkLoveCollision();
                
                if (!quizActive) {
                    score++;
                }
                document.getElementById('scoreDisplay').innerText = `🏁 ${Math.floor(score/10)}${loveScore > 0 ? ' ✨' + loveScore : ''}`;
                
                frame++;
            }

            if (!quizActive && gameRunning && !gameOver) {
                // Update timer display
                timeUntilNextQuiz = Math.ceil((quizTimer ? QUIZ_INTERVAL/1000 : 0) - (Date.now() % QUIZ_INTERVAL)/1000);
                document.getElementById('timerDisplay').innerText = `⏰ ${timeUntilNextQuiz}s`;
            }

            draw();
            
            // LANJUTKAN LOOP HANYA JIKA BELUM GAME OVER
            if (!gameOver) {
                animationFrame = requestAnimationFrame(gameLoop);
            }
        }



        function updateLivesDisplay() {
            let hearts = '';
            for (let i=0; i<lives; i++) hearts += '❤️ ';
            document.getElementById('livesDisplay').innerHTML = hearts || '💔 game over';
            
            // Update juga love score di status bar (sudah diupdate di gameLoop)
        }

        // reset game

        function resetGame() {
            currentAccount = playerNameInput.value.trim() || 'Penjelajah';
            player.icon = selectedIcon;

            // update highscore
            let finalScore = Math.floor(score/10);
            if (finalScore > (highscoreMap.get(currentAccount) || 0)) {
                updateHighscoreForAccount(currentAccount, finalScore);
            }

            if (loveScore > (loveHighscoreMap.get(currentAccount) || 0)) {
                loveHighscoreMap.set(currentAccount, loveScore);
            }

            saveHighscoreToStorage();
            updateHighscoreDisplay();

            // reset state
            lives = 6;
            score = 0;
            loveScore = 0;
            loves = []; 
            player.x = 200;
            player.y = 300;
            player.vy = 0;
            player.vx = 0;
            cameraX = 0;
            gameRunning = true;
            gameOver = false;  // RESET GAME OVER FLAG
            quizActive = false;
            currentQuiz = null;
            collisionCooldown = 0;
            
            // Sembunyikan modal
            quizModalOverlay.style.display = 'none';
            
            updateLivesDisplay();
            document.getElementById('scoreDisplay').innerText = '🏁 0';
            modalFeedbackText.innerText = '';
            modalQuizOptions.innerHTML = '';
            modalQuizQuestion.innerText = 'Tebak nama ...';

            // Hentikan animation frame lama jika ada
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            
            // Mulai loop baru
            animationFrame = requestAnimationFrame(gameLoop);

            startQuizTimer();

            setTimeout(() => {
                if (gameRunning) {
                    spawnLove();
                    spawnLove();
                }
            }, 500);
        }
        
        modalResetBtn.addEventListener('click', resetGame);
        canvas.addEventListener('click', function initAudioOnFirstClick() {
            initAudio();
            canvas.removeEventListener('click', initAudioOnFirstClick);
        }, { once: true });

        window.addEventListener('beforeunload', function() {
            stopQuizTimer();
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        });

        // start
        resetGame();



    })();
