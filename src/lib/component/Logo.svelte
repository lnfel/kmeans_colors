<a href="/" class="logo group flex items-center text-indigo-500 dark:text-indigo-200 outline-none">
    <!-- generated using https://picsvg.com/ -->
    <!-- https://stackoverflow.com/questions/43744050/animated-light-reflection-on-image-in-css-or-jquery -->
    <svg class="logo-image group-hover:text-[#e4b124] group-focus:text-[#e4b124]" version="1.0" xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 300 223" preserveAspectRatio="xMidYMid meet">
        <defs>
            <!-- 
                This is the base linearGradient, tried applying it on the <g> element
                but the animation takes place on each path at the same time.
                Animate linearGradient's gradientTransform attribute
                using values from 1,0; (right) to -1,0; (left)
                then we added dummy values of -1,0; (left) at the end of animation and set duration to 3s,
                this will simulate delay on the animation
            -->
            <!-- <linearGradient id="logo-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                <stop offset="18%" stop-color="#e4b124"/>
                <stop offset="49%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#ffffff"/>
                <stop offset="77%" stop-color="#e4b124"/>
                <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" fill="freeze" repeatCount="indefinite" />
            </linearGradient> -->
            <!--
                Here we defined multiple linearGradient and added begin attribute for each
                animateTransform to have a staggered effect. Apparently I haven't found any
                way to do this without creating a bunch of similar linearGradient
            -->
            <linearGradient id="upper-right-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                <stop offset="18%" stop-color="#e4b124"/>
                <stop offset="49%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#ffffff"/>
                <stop offset="77%" stop-color="#e4b124"/>
                <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" fill="freeze" repeatCount="indefinite" />
            </linearGradient>
            <linearGradient id="mid-trapezoid-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                <stop offset="18%" stop-color="#e4b124"/>
                <stop offset="49%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#ffffff"/>
                <stop offset="77%" stop-color="#e4b124"/>
                <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" begin="0.1s" fill="freeze" repeatCount="indefinite" />
            </linearGradient>
            <linearGradient id="short-arc-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                <stop offset="18%" stop-color="#e4b124"/>
                <stop offset="49%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#ffffff"/>
                <stop offset="77%" stop-color="#e4b124"/>
                <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" begin="0.2s" fill="freeze" repeatCount="indefinite" />
            </linearGradient>
            <linearGradient id="long-arc-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                <stop offset="18%" stop-color="#e4b124"/>
                <stop offset="49%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#ffffff"/>
                <stop offset="77%" stop-color="#e4b124"/>
                <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" begin="0.3s" fill="freeze" repeatCount="indefinite" />
            </linearGradient>
        </defs>
        <g fill="currentColor" transform="translate(0,223) scale(0.1,-0.1)" stroke="none">
            <path id="upper-right" d="M2474 1887 l-329 -263 -85 86 c-192 195 -402 283 -675 283 -107 0 -147 -5 -227 -26 -159 -42 -345 -152 -452 -266 l-30 -31 172 0 173 0 60 31 c91 45 196 69 309 69 194 0 358 -68 495 -205 l80 -80 -300 -5 -299 -5 -219 -280 c-120 -154 -220 -285 -223 -292 -5 -10 440 -593 451 -593 2 0 113 141 247 312 133 172 455 586 715 921 260 334 471 607 469 607 -2 0 -152 -118 -332 -263z"/>
            <path id="mid-trapezoid" d="M570 1430 c-22 -35 -29 -54 -22 -63 5 -6 59 -76 119 -153 l110 -142 144 185 c79 102 150 194 157 204 13 18 5 19 -231 19 l-245 0 -32 -50z"/>
            <path id="short-arc" d="M430 877 c0 -36 38 -163 70 -233 60 -133 188 -290 297 -365 l42 -30 61 76 c33 42 60 80 60 85 0 5 -15 18 -34 29 -54 34 -171 163 -209 232 -20 35 -48 101 -63 147 l-27 82 -99 0 c-95 0 -98 -1 -98 -23z"/>
            <path id="long-arc" d="M239 1433 c-47 -122 -73 -304 -66 -457 17 -342 176 -653 446 -869 l64 -51 39 44 c21 25 38 50 38 55 0 6 -16 21 -36 34 -58 40 -176 160 -227 232 -95 134 -164 305 -188 469 -15 104 -6 287 19 385 l17 70 -44 58 c-24 31 -46 57 -48 57 -2 0 -8 -12 -14 -27z"/>
        </g>
    </svg>
    <h1 class="logo-text text-3xl font-extrabold tracking-wide">Aerial</h1>
</a>