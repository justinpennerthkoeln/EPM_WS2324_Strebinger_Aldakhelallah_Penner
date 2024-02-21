document.addEventListener('DOMContentLoaded', () => {
    
    const ALERT = document.querySelector('#alert');
    const PARAMS = new URLSearchParams(window.location.search);

    if(PARAMS.has('error') || PARAMS.has('success')) {

        if (PARAMS.has('error')) {
            const ERROR = PARAMS.get('error').replaceAll('_', ' ');
            ALERT.textContent = ERROR;
            ALERT.classList.add('error');
        } 
        else if (PARAMS.has('success')) {
            const SUCCESS = PARAMS.get('success').replaceAll('_', ' ');
            ALERT.textContent = SUCCESS;
            ALERT.classList.add('success');
        }

        gsap.to(ALERT, {
            duration: 1,
            opacity: 1, 
            y: '-100%',
            ease: 'power3.inOut'
        });

        gsap.to(ALERT, {
            delay: 3,
            duration: 1,
            opacity: 0, 
            y: '100%',
            ease: 'power3.inOut'
        });

        setTimeout(() => {
            ALERT.classList.remove('error');
            ALERT.classList.remove('success');
        }, 5000);

    }

});