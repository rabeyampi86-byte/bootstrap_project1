document.addEventListener('DOMContentLoaded', () => {
    const cartCount = document.querySelector('.cart-count');
    const getCart = () => JSON.parse(localStorage.getItem('travelCart') || '[]');
    const getWishlist = () => JSON.parse(localStorage.getItem('travelWishlist') || '[]');
    const saveCart = (items) => {
        localStorage.setItem('travelCart', JSON.stringify(items));
        localStorage.setItem('travelCartCount', String(items.reduce((total, item) => total + item.quantity, 0)));
        updateCartCount(items);
    };
    const cartItems = getCart();

    updateCartCount(cartItems);

    document.querySelectorAll('a').forEach((link) => {
        if (link.textContent.trim() === 'Travel journal' && link.getAttribute('href')?.includes('#contact')) {
            link.href = 'journal.html';
        }
    });

    let pendingBooking = null;
    const paymentModal = document.querySelector('[data-payment-modal]');
    const paymentSummary = document.querySelector('[data-payment-summary]');
    const closePaymentModal = () => {
        if (!paymentModal) return;
        paymentModal.hidden = true;
        document.body.classList.remove('payment-open');
    };

    document.querySelectorAll('[data-payment-close]').forEach((button) => button.addEventListener('click', closePaymentModal));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && paymentModal && !paymentModal.hidden) closePaymentModal();
    });

    document.querySelectorAll('.booking-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            const button = form.querySelector('[data-add-to-cart]');
            const product = form.closest('.package-product');
            const quantity = Number(form.querySelector('input[type="number"]').value || 1);
            pendingBooking = {
                id: product.id,
                name: button.dataset.addToCart,
                price: product.querySelector('.product-price').textContent.trim().replace(/\s+\/ person$/, ''),
                image: product.querySelector('img').src,
                start: form.querySelector('input[type="date"]').value,
                end: form.querySelectorAll('input[type="date"]')[1].value,
                quantity
            };
            if (paymentSummary) paymentSummary.textContent = `${pendingBooking.name} · ${pendingBooking.quantity} guest${pendingBooking.quantity === 1 ? '' : 's'} · ${pendingBooking.price}`;
            if (paymentModal) {
                paymentModal.hidden = false;
                document.body.classList.add('payment-open');
                paymentModal.querySelector('input[name="paymentMethod"]')?.focus();
            }
        });
    });

    document.querySelector('[data-payment-form]')?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!pendingBooking) return;
        const method = new FormData(event.currentTarget).get('paymentMethod');
        pendingBooking.paymentMethod = method;
        const items = getCart().filter((cartItem) => cartItem.id !== pendingBooking.id);
        items.push(pendingBooking);
        saveCart(items);
        closePaymentModal();
        window.location.href = 'cart.html';
    });

    document.querySelectorAll('[data-remove-cart-item]').forEach((button) => {
        button.addEventListener('click', () => {
            saveCart(getCart().filter((item) => item.id !== button.dataset.removeCartItem));
            renderCart();
        });
    });


    document.querySelectorAll('.wishlist').forEach((button) => {
        const itemName = button.dataset.wishlist || button.getAttribute('aria-label').replace(/^Add | to wishlist$/g, '');
        const wishlist = getWishlist();
        const isSaved = wishlist.includes(itemName);
        button.setAttribute('aria-pressed', String(isSaved));
        button.textContent = isSaved ? '♥' : '♡';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const updatedWishlist = getWishlist();
            const itemIndex = updatedWishlist.indexOf(itemName);
            if (itemIndex === -1) updatedWishlist.push(itemName);
            else updatedWishlist.splice(itemIndex, 1);
            localStorage.setItem('travelWishlist', JSON.stringify(updatedWishlist));
            const saved = itemIndex === -1;
            button.setAttribute('aria-pressed', String(saved));
            button.textContent = saved ? '♥' : '♡';
        });
    });
    document.querySelector('[data-clear-cart]')?.addEventListener('click', () => {
        saveCart([]);
        renderCart();
    });

    document.querySelector('[data-checkout-form]')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const confirmation = document.querySelector('[data-checkout-confirmation]');
        confirmation.textContent = `Thank you, ${form.querySelector('[name="name"]').value}. Your booking request has been received. Our travel team will contact you shortly.`;
        confirmation.hidden = false;
        saveCart([]);
        renderCart();
        form.reset();
    });

    renderCart();

    document.querySelectorAll('.newsletter-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = form.querySelector('input[type="email"]');
            const message = document.createElement('p');
            message.className = 'form-feedback';
            message.setAttribute('role', 'status');
            message.textContent = `Thanks. We will send fresh travel ideas to ${email.value}.`;
            form.replaceWith(message);
        });
    });

    document.querySelectorAll('.contact-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = document.createElement('p');
            message.className = 'form-feedback';
            message.setAttribute('role', 'status');
            message.textContent = 'Thanks for reaching out. Our travel team will be in touch shortly.';
            form.replaceWith(message);
        });
    });

    function updateCartCount(items) {
        if (cartCount) cartCount.textContent = items.reduce((total, item) => total + item.quantity, 0);
    }

    function renderCart() {
        const list = document.querySelector('[data-cart-list]');
        if (!list) return;
        const items = getCart();
        const emptyState = document.querySelector('[data-cart-empty]');
        const checkout = document.querySelector('[data-cart-checkout]');
        list.innerHTML = '';
        items.forEach((item) => {
            const row = document.createElement('article');
            row.className = 'cart-item';
            row.innerHTML = `<img src="${item.image}" alt=""><div><span>${item.start} to ${item.end}</span><h3>${item.name}</h3><p>${item.quantity} guest${item.quantity === 1 ? '' : 's'} · ${item.price} per person</p></div><button class="cart-remove" type="button" data-remove-cart-item="${item.id}">Remove</button>`;
            row.querySelector('button').addEventListener('click', () => {
                saveCart(getCart().filter((cartItem) => cartItem.id !== item.id));
                renderCart();
            });
            list.appendChild(row);
        });
        emptyState.hidden = items.length > 0;
        checkout.hidden = items.length === 0;
        const total = document.querySelector('[data-cart-total]');
        if (total) total.textContent = `${items.reduce((sum, item) => sum + Number(item.price.replace(/[^0-9]/g, '')) * item.quantity, 0).toLocaleString()} ৳`;
    }

    const homeSearchButton = document.querySelector('[data-home-search]');
    if (homeSearchButton) {
        homeSearchButton.addEventListener('click', () => {
            const destination = document.querySelector('#destination').value.trim();
            const tripType = document.querySelector('#tripType').value;
            const target = tripType === 'Local experience' ? 'experience.html' : 'tour-market.html';
            window.location.href = destination ? `${target}?search=${encodeURIComponent(destination)}` : target;
        });
    }

    const marketSearchButton = document.querySelector('[data-market-search]');
    if (marketSearchButton) {
        marketSearchButton.closest('form')?.addEventListener('submit', (event) => {
            event.preventDefault();
            filterMarketCards();
        });
        document.querySelector('#marketSearch')?.addEventListener('search', filterMarketCards);
        document.querySelector('#marketSearch')?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') filterMarketCards();
        });

        const searchParams = new URLSearchParams(window.location.search);
        const initialQuery = searchParams.get('search');
        if (initialQuery) {
            document.querySelector('#marketSearch').value = initialQuery;
            filterMarketCards();
        }
    }

    function filterMarketCards() {
        const query = document.querySelector('#marketSearch').value.trim().toLowerCase();
        const destination = document.querySelector('#marketDestination').value.toLowerCase();
        const duration = document.querySelector('#marketDuration').value.toLowerCase();
        const cards = document.querySelectorAll('.market-card');
        let visibleCount = 0;

        cards.forEach((card) => {
            const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
            const category = card.querySelector('.category')?.textContent.toLowerCase() || '';
            const durationMatch = category.match(/(\d+)\s*days?/);
            const cardDuration = card.dataset.duration || (durationMatch && (Number(durationMatch[1]) <= 3 ? '1–3 days' : Number(durationMatch[1]) <= 7 ? '4–7 days' : '8+ days'));
            const cardDestination = card.dataset.destination || category.split('·')[0].trim();
            const matchesDestination = destination.startsWith('all') || cardDestination === destination;
            const matchesDuration = duration.startsWith('any') || cardDuration === duration;
            const visible = matchesQuery && matchesDestination && matchesDuration;
            card.closest('.col-md-6').hidden = !visible;
            if (visible) visibleCount += 1;
        });

        document.querySelector('.market-count').textContent = `${visibleCount} tour${visibleCount === 1 ? '' : 's'} available`;
    }

    document.querySelectorAll('.experience-tabs a').forEach((tab) => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            const category = tab.getAttribute('href').slice(1);
            document.querySelectorAll('.experience-tabs a').forEach((item) => item.classList.toggle('active', item === tab));
            document.querySelectorAll('#all-experiences > div').forEach((card) => {
                const cardLabel = card.querySelector('.category')?.textContent.toLowerCase() || '';
                const cardCategory = card.dataset.category || (cardLabel.startsWith('food') ? 'food' : cardLabel.startsWith('nature') ? 'nature' : cardLabel.startsWith('art') ? 'craft' : '');
                card.hidden = category !== 'all-experiences' && cardCategory !== category;
            });
            document.querySelector('.experience-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});
