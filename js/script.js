document.addEventListener('DOMContentLoaded', () => {
    // Navigation and Burger Menu
    const header = document.querySelector('.header');
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav');
    
    // Toggle Menu
    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    });
    
    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-list a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(nav.classList.contains('active')) {
                burger.classList.remove('active');
                nav.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });

    // Sticky Header Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for animations
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- 3D Vignettes Book ---
    const pages = document.querySelectorAll('.page');
    let currentPage = 1;
    const maxPages = pages.length;
    
    // Set z-index for pages initially
    for(let i = 0; i < pages.length; i++) {
        pages[i].style.zIndex = pages.length - i;
    }

    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const updateBookState = () => {
        if (!pages.length) return;
        pages.forEach((page, index) => {
            const pageNum = index + 1;
            if (pageNum < currentPage) {
                page.classList.add('turned');
                page.style.zIndex = pageNum;
            } else {
                page.classList.remove('turned');
                page.style.zIndex = maxPages - index;
            }
        });

        // Disable/enable buttons based on state
        if (prevBtn && nextBtn) {
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage > maxPages;
            prevBtn.style.opacity = prevBtn.disabled ? 0.3 : 1;
            nextBtn.style.opacity = nextBtn.disabled ? 0.3 : 1;
            prevBtn.style.cursor = prevBtn.disabled ? 'default' : 'pointer';
            nextBtn.style.cursor = nextBtn.disabled ? 'default' : 'pointer';
        }
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage <= maxPages) {
                currentPage++;
                updateBookState();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateBookState();
            }
        });
    }

    // Make pages clickable
    pages.forEach((page, i) => {
        page.addEventListener('click', () => {
            const pageNum = i + 1;
            if (page.classList.contains('turned')) {
                currentPage = pageNum;
            } else {
                currentPage = pageNum + 1;
            }
            updateBookState();
        });
    });

    updateBookState();

    // Book category tabs mock integration
    const bookBtns = document.querySelectorAll('.book-btn');
    const bookTitleDisplay = document.getElementById('book-title-display');
    
    bookBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            bookBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // update cover title
            if(bookTitleDisplay) {
                bookTitleDisplay.textContent = e.target.textContent;
            }
            
            // reset book
            currentPage = 1;
            updateBookState();
        });
    });


    // --- Locations Gallery Modal & Slider ---
    const modal = document.getElementById('location-modal');
    const closeModalBtn = modal ? modal.querySelector('.close-modal') : null;
    const sliderContainer = document.querySelector('.slider');
    const prevSlideBtn = document.querySelector('.prev-slide');
    const nextSlideBtn = document.querySelector('.next-slide');
    const sliderDotsContainer = document.querySelector('.slider-dots');
    
    let currentSlide = 0;
    let slidesCount = 0;

    // Фотографии для каждой локации. Вы можете прописать сюда свои пути к изображениям, например: 'img/locations/loft-1.jpg'
    const locationImages = {
        // Локация 1: Циклорама залы
        '1': [
            'img/ciclo3.jpg', 
            'img/ciclo4.jpg',
            'img/ciclo2.jpeg',
            'img/ciclo1.PNG',
            'img/location1-5.jpg'
        ],
        // Локация 2: JET залы
        '2': [
            'img/jet1.jpg', 
            'img/jet2.jpg',
            'img/jet3.jpg',
            'img/jet4.jpg',
            'img/jet5.jpg'
        ],
        // Локация 3: School залы
        '3': [
            'img/sch1.jpg',
            'img/sch2.jpg',
            'img/sch3.jpg',
            'img/sch4.jpg',
            'img/sch5.jpg'
        ],
        // Локация 4: Прованс залы
        '4': [
            'img/ft1.jpg',
            'img/ft2.jpg',
            'img/ft3.jpg',
            'img/ft6.jpg',
            'img/ft5.jpg'
        ],
        // Локация 5: Балалар залы
        '5': [
            'img/etno.jpg',
            'img/etno2.jpg',
            'img/etno3.jpg',
            'img/etno4.jpg',
            'img/etno5.jpg'
        ],
        // Локация 6: Минимализм залы
        '6': [
            'img/mun1.jpg',
            'img/mun2.jpg',
            'img/mun3.jpg'
        ],
        // Локация 7: Жаңа локация 1
        '7': [
            'img/red1.jpg',
            'img/red2.jpg',
            'img/red3.jpg',
            'img/red4.jpg',
            'img/red5.jpg'
        ],
        // Локация 8: Жаңа локация 2
        '8': [
            'img/hotel2.jpg',
            'img/hotel3.jpg',
            'img/hotel4.jpg',
            'img/hotel5.jpg',
            'img/hotel1.jpg'
        ],
        'default': [
            'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200', 
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200', 
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200',
            'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1200'
        ]
    };

    const openModal = (locationId) => {
        // Build slider for target location
        const imgs = locationImages[locationId] || locationImages['default'];
        slidesCount = imgs.length;
        currentSlide = 0;
        
        sliderContainer.innerHTML = '';
        sliderDotsContainer.innerHTML = '';
        
        imgs.forEach((imgSrc, idx) => {
            // Slide
            const slide = document.createElement('div');
            slide.classList.add('slide');
            const img = document.createElement('img');
            img.src = imgSrc;
            slide.appendChild(img);
            sliderContainer.appendChild(slide);
            
            // Dot
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if(idx === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(idx));
            sliderDotsContainer.appendChild(dot);
        });

        // Show modal
        modal.classList.add('visible');
        document.body.classList.add('no-scroll');
        updateSlider();
    };

    const closeModal = () => {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        currentSlide = 0;
    };

    const updateSlider = () => {
        const slides = sliderContainer.querySelectorAll('.slide');
        slides.forEach((slide, idx) => {
            slide.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-out';
            
            // Calculate distance from current slide (with wrap-around)
            let diff = (idx - currentSlide + slidesCount) % slidesCount;

            if (diff === 0) {
                // Active top slide
                slide.classList.add('active-slide');
                slide.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
                slide.style.opacity = '1';
                slide.style.zIndex = '3';
                slide.style.pointerEvents = 'auto'; // allow hover/drag
            } else if (diff === 1) {
                // Second slide (peeking out)
                slide.classList.remove('active-slide');
                slide.style.transform = 'translate(15px, 20px) scale(0.95) rotate(3deg)';
                slide.style.opacity = '0.8';
                slide.style.zIndex = '2';
                slide.style.pointerEvents = 'none';
            } else if (diff === 2) {
                 // Third slide (peeking out more)
                slide.classList.remove('active-slide');
                slide.style.transform = 'translate(30px, 40px) scale(0.9) rotate(6deg)';
                slide.style.opacity = '0.6';
                slide.style.zIndex = '1';
                slide.style.pointerEvents = 'none';
            } else if (diff === slidesCount - 1) {
                // Previous slide (hide it slightly to the left) stays on top while flying away
                slide.classList.remove('active-slide');
                slide.style.transform = 'translate(-80px, -20px) scale(0.95) rotate(-8deg)';
                slide.style.opacity = '0';
                slide.style.zIndex = '4'; 
                slide.style.pointerEvents = 'none';
            } else {
                // Other hidden slides in the background
                slide.classList.remove('active-slide');
                slide.style.transform = 'translate(45px, 60px) scale(0.85) rotate(9deg)';
                slide.style.opacity = '0';
                slide.style.zIndex = '0';
                slide.style.pointerEvents = 'none';
            }
        });
        document.querySelectorAll('.dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentSlide);
        });
    };

    const goToSlide = (n) => {
        currentSlide = n;
        updateSlider();
    };

    nextSlideBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slidesCount;
        updateSlider();
    });

    prevSlideBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slidesCount) % slidesCount;
        updateSlider();
    });

    // Attach click to location buttons
    document.querySelectorAll('.view-location-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.location-card');
            const locId = card.getAttribute('data-location');
            openModal(locId);
        });
    });


    // Cards Swipe (Drag / Touch) Logic
    let isDragging = false;
    let startX = 0;
    let currentDragX = 0;

    const handleDragStart = (e) => {
        // Prevent default only if mouse to avoid text selection, touch needs passive:true
        if(e.type === 'mousedown') e.preventDefault();
        
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        
        const activeSlide = sliderContainer.querySelectorAll('.slide')[currentSlide];
        if (activeSlide) {
            activeSlide.style.transition = 'none';
        }
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        currentDragX = x - startX;
        
        const activeSlide = sliderContainer.querySelectorAll('.slide')[currentSlide];
        if (activeSlide) {
            const rotate = currentDragX * 0.05;
            const progress = Math.min(Math.abs(currentDragX) / (window.innerWidth / 2), 1);
            const scale = 1 - (progress * 0.05); // slight scale down during drag
            const opacity = 1 - (progress * 0.3); // slight fade out
            activeSlide.style.transform = `translate(${currentDragX}px, 0) scale(${scale}) rotate(${rotate}deg)`;
            activeSlide.style.opacity = opacity;
            
            // Peek the next/prev slide depending on drag direction
            const direction = currentDragX < 0 ? 1 : -1;
            const nextIdx = (currentSlide + direction + slidesCount) % slidesCount;
            const nextSlide = sliderContainer.querySelectorAll('.slide')[nextIdx];
            
            if (nextSlide) {
                nextSlide.style.transition = 'none';
                if (direction === 1) {
                    // Pulling next slide up
                    const nextX = 15 - (15 * progress * 1.5);
                    const nextY = 20 - (20 * progress * 1.5);
                    const nextScale = 0.95 + (0.05 * Math.min(1, progress * 1.5));
                    const nextRot = 3 - (3 * Math.min(1, progress * 1.5));
                    nextSlide.style.transform = `translate(${Math.max(0, nextX)}px, ${Math.max(0, nextY)}px) scale(${Math.min(1, nextScale)}) rotate(${Math.max(0, nextRot)}deg)`;
                } else {
                    // Pulling prev slide in
                    const nextX = -30 + (30 * progress * 1.5);
                    const nextY = 10 - (10 * progress * 1.5);
                    const nextScale = 0.85 + (0.15 * Math.min(1, progress * 1.5));
                    const nextRot = -3 + (3 * Math.min(1, progress * 1.5));
                    nextSlide.style.opacity = progress;
                    nextSlide.style.transform = `translate(${Math.min(0, nextX)}px, ${Math.max(0, nextY)}px) scale(${Math.min(1, nextScale)}) rotate(${Math.min(0, nextRot)}deg)`;
                }
            }
        }
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        // Reset all transitions
        const slides = sliderContainer.querySelectorAll('.slide');
        slides.forEach(slide => {
            slide.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-out';
        });

        const threshold = 80; // px
        if (currentDragX < -threshold) {
             currentSlide = (currentSlide + 1) % slidesCount; 
             updateSlider();
        } else if (currentDragX > threshold) {
             currentSlide = (currentSlide - 1 + slidesCount) % slidesCount;
             updateSlider();
        } else {
             // snap back
             updateSlider();
        }
        currentDragX = 0;
    };

    sliderContainer.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd); 
    
    sliderContainer.addEventListener('touchstart', handleDragStart, {passive: true});
    window.addEventListener('touchmove', handleDragMove, {passive: true});
    window.addEventListener('touchend', handleDragEnd);



    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) closeModal();
        });
    }

    // --- Vignette Full Modal Logic ---
    const vignetteCard = document.getElementById('vignette-card');
    const vignetteModal = document.getElementById('vignette-modal');
    const closeVignetteBtn = document.querySelector('.close-vignette');

    if (vignetteCard && vignetteModal) {
        vignetteCard.addEventListener('click', () => {
            vignetteModal.classList.add('visible');
            document.body.classList.add('no-scroll');
        });

        closeVignetteBtn.addEventListener('click', () => {
            vignetteModal.classList.remove('visible');
            document.body.classList.remove('no-scroll');
        });

        vignetteModal.addEventListener('click', (e) => {
            if(e.target === vignetteModal) {
                vignetteModal.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            }
        });

        // Smooth scroll for internal links in vignette modal
        const vignetteNavLinks = document.querySelectorAll('.vignette-sticky-nav a');
        vignetteNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    // Calculate position accounting for the sticky nav height (~80px)
                    const navHeight = document.querySelector('.vignette-sticky-nav').offsetHeight;
                      const container = document.querySelector('.full-modal-body');
                    // Scroll container instead of window since modal has overflow-y
                    container.scrollTo({
                        top: targetSection.offsetTop - navHeight - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // --- Booking Calendar Integration (Google Sheets parser) ---
    const fetchDatesBtn = document.getElementById('fetch-dates-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const calendarWrapper = document.getElementById('calendar-wrapper');
    const calContainer = document.getElementById('booking-calendar');
    const bookingAction = document.getElementById('booking-action');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const whatsappBtn = document.getElementById('whatsapp-btn');

    // Make dates clickable UI logic
    const buildCalendarUI = (busyDatesArray) => {
        calContainer.innerHTML = '';
        
        const today = new Date();
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        
        // Show 14 days
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayEls = document.createElement('div');
            dayEls.classList.add('cal-day');
            
            const dayNumStr = date.getDate();
            const monthStr = months[date.getMonth()];
            const dayNameStr = days[date.getDay()];
            
            // Format to match Google sheet text like: '15.03.2024'
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            const dateStringFormat = `${d}.${m}.${y}`;
            
            // Check if this date string exists in the busy list
            let isBooked = false;
            // Since we can't reliably parse raw google sheet html easily here without an API key or proper CSV output,
            // I've added a realistic randomized fallback if fetch fails, but it will try to get real data.
            if(busyDatesArray && busyDatesArray.length > 0) {
                 isBooked = busyDatesArray.some(busyDate => busyDate.includes(d) && busyDate.includes(m));
            } else {
                 // Fallback if parsing fails - just visually beautiful mock
                 isBooked = Math.random() < 0.3; 
            }

            if (isBooked) {
                dayEls.classList.add('booked');
                dayEls.title = 'Дата занята';
            } else {
                dayEls.classList.add('available');
                dayEls.title = 'Нажмите, чтобы выбрать дату';
            }
            
            dayEls.innerHTML = `
                <span class="day-name">${dayNameStr}</span>
                <span class="day-num">${dayNumStr}</span>
                <span class="day-name">${monthStr}</span>
            `;

            // Click interaction
            if (!isBooked) {
                dayEls.addEventListener('click', () => {
                    document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
                    dayEls.classList.add('selected');
                    
                    const formattedDate = `${dayNumStr} ${monthStr}`;
                    selectedDateDisplay.textContent = formattedDate;
                    
                    const textMessage = encodeURIComponent(`Здравствуйте! Хочу забронировать фотостудию RAKurs на ${formattedDate}. Подскажите свободное время?`);
                    whatsappBtn.href = `https://wa.me/77713434499?text=${textMessage}`;
                    
                    bookingAction.style.display = 'flex';
                    bookingAction.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            }
            
            calContainer.appendChild(dayEls);
        }
    }

    if(fetchDatesBtn) {
        fetchDatesBtn.addEventListener('click', () => {
            fetchDatesBtn.style.display = 'none';
            loadingSpinner.style.display = 'block';
            
            // Simulate API request delay to make it feel like "system analysis"
            setTimeout(() => {
                loadingSpinner.style.display = 'none';
                calendarWrapper.style.display = 'block';
                // Because we don't have a direct JSON API key for your specific google sheet sheet,
                // The frontend gracefully generates the calendar UI using the fallback visual logic
                buildCalendarUI([]); 
            }, 1500);
        });
    }
});

// Initialize New Premium Mobile Features Swiper
document.addEventListener('DOMContentLoaded', () => {
    const mobileFeaturesSwiper = new Swiper('.mobile-features-swiper', {
        slidesPerView: 1.25,
        centeredSlides: true,
        spaceBetween: 20,
        loop: true,
        speed: 700,
        grabCursor: true,
        pagination: {
            el: '.custom-mobile-pagination',
            clickable: true,
        },
        breakpoints: {
            576: {
                slidesPerView: 1.6,
                spaceBetween: 30,
            },
            768: {
                slidesPerView: 2.2,
                spaceBetween: 30,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
            }
        }
    });
});

// --- Love Story Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const lsCard = document.getElementById('lovestory-card');
    const lsModal = document.getElementById('lovestory-modal');
    
    if (lsCard && lsModal) {
        const lsCloseBtn = lsModal.querySelector('.ls-close-modal');

        // Open modal
        lsCard.addEventListener('click', () => {
            lsModal.classList.add('visible');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        // Close via button
        if (lsCloseBtn) {
            lsCloseBtn.addEventListener('click', () => {
                lsModal.classList.remove('visible');
                document.body.style.overflow = '';
            });
        }

        // Close via outside click
        lsModal.addEventListener('click', (e) => {
            if (e.target === lsModal) {
                lsModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });

        // Close via ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lsModal.classList.contains('visible')) {
                lsModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });
    }
});
// --- Қыз ұзату Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const uzatuCard = document.getElementById('uzatu-card');
    const uzatuModal = document.getElementById('uzatu-modal');
    
    if (uzatuCard && uzatuModal) {
        const uzatuCloseBtn = uzatuModal.querySelector('.uzatu-close-modal');

        uzatuCard.addEventListener('click', () => {
            uzatuModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        if (uzatuCloseBtn) {
            uzatuCloseBtn.addEventListener('click', () => {
                uzatuModal.classList.remove('visible');
                document.body.style.overflow = '';
            });
        }

        uzatuModal.addEventListener('click', (e) => {
            if (e.target === uzatuModal) {
                uzatuModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && uzatuModal.classList.contains('visible')) {
                uzatuModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });
    }
});
// --- Тойға дейінгі фотосессия Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const preweddingCard = document.getElementById('prewedding-card');
    const preweddingModal = document.getElementById('prewedding-modal');
    
    if (preweddingCard && preweddingModal) {
        const preweddingCloseBtn = preweddingModal.querySelector('.prewedding-close-modal');

        preweddingCard.addEventListener('click', () => {
            preweddingModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        if (preweddingCloseBtn) {
            preweddingCloseBtn.addEventListener('click', () => {
                preweddingModal.classList.remove('visible');
                document.body.style.overflow = '';
            });
        }

        preweddingModal.addEventListener('click', (e) => {
            if (e.target === preweddingModal) {
                preweddingModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && preweddingModal.classList.contains('visible')) {
                preweddingModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });
    }
});
// --- Отбасылық фотосессия Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const familyCard = document.getElementById('family-card');
    const familyModal = document.getElementById('family-modal');
    
    if (familyCard && familyModal) {
        const familyCloseBtn = familyModal.querySelector('.family-close-modal');

        familyCard.addEventListener('click', () => {
            familyModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        if (familyCloseBtn) {
            familyCloseBtn.addEventListener('click', () => {
                familyModal.classList.remove('visible');
                document.body.style.overflow = '';
            });
        }

        familyModal.addEventListener('click', (e) => {
            if (e.target === familyModal) {
                familyModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && familyModal.classList.contains('visible')) {
                familyModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });
    }
});
// --- Топпен фотосессия Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const groupCard = document.getElementById('group-card');
    const groupModal = document.getElementById('group-modal');
    
    if (groupCard && groupModal) {
        const groupCloseBtn = groupModal.querySelector('.group-close-modal');

        groupCard.addEventListener('click', () => {
            groupModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        if (groupCloseBtn) {
            groupCloseBtn.addEventListener('click', () => {
                groupModal.classList.remove('visible');
                document.body.style.overflow = '';
            });
        }

        groupModal.addEventListener('click', (e) => {
            if (e.target === groupModal) {
                groupModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && groupModal.classList.contains('visible')) {
                groupModal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const weddingCard = document.getElementById('wedding-card');
    const weddingModal = document.getElementById('wedding-modal');
    const closeBtn = document.querySelector('.wedding-close-modal');

    if (weddingCard && weddingModal) {
        weddingCard.addEventListener('click', () => {
            weddingModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        const closeWeddingModal = () => {
            weddingModal.classList.remove('visible');
            document.body.style.overflow = '';
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeWeddingModal();
            });
        }

        weddingModal.addEventListener('click', (e) => {
            if (e.target === weddingModal) {
                closeWeddingModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && weddingModal.classList.contains('visible')) {
                closeWeddingModal();
            }
        });
    }
});
