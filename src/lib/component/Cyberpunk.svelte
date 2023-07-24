<script>
    /**
     * Thinking on ways to solve GLITCH effects
     * - AdamArgyle
     * https://www.youtube.com/watch?v=MR7dClW6iBg
     * https://gui-challenges.web.app/glitch/dist/
     */

    /**
     * Generate random css glitch effect via keyframes
     * 
     * @returns {String} css keyframes string
     */
    function glitchyPaths() {
        return `
        @keyframes cyberpunk-glitch {
            0%  { clip-path: polygon(${punkyPolygons()}); }
            4%  { clip-path: polygon(${punkyPolygons()}); }
            27% { clip-path: polygon(${punkyPolygons()}); }
            51% { clip-path: polygon(${punkyPolygons()}); }
            66% { clip-path: polygon(${punkyPolygons()}); }
            91% { clip-path: polygon(${punkyPolygons()}); }

            1%, 5%, 28%, 53%, 67%, 92% {
                clip-path: none;
            }
        }
        `.trim()
    }

    /**
     * @returns {String} css clip-path polygon string value
     */
    function punkyPolygons() {
        const collection = new Set()

        for (let i = 0; i <= 25; i++)
            collection.add(`${randomZeroToHundred()}% ${randomZeroToHundred()}%`)
        
        return Array.from(collection.values()).join(',')
    }

    /**
     * Just a normal randomizer from 0 - 100
     */
    function randomZeroToHundred() {
        return (Math.random() * 100).toFixed()
    }

    // console.log(glitchyPaths())
</script>

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
    <h1 class="logo-text text-3xl font-extrabold tracking-wide"><span class="logo-text-inner block">Aerial</span></h1>
</a>

<style>
    /* Cyberpunk glitch effect */
    @media (prefers-reduced-motion: no-preference) {
        .logo:hover > .logo-text::after,
        .logo:focus > .logo-text::after,
        .logo:hover > .logo-image,
        .logo:focus > .logo-image {
            content: '';
            animation:
                cyberpunk-glitch 7s step-end 7.1s infinite,
                skew-glitch 7s step-end 7.1s infinite,
                change-text 7s step-end 7.1s infinite;
        }

        .logo:hover .logo-text-inner,
        .logo:focus .logo-text-inner {
            transform: scale(1);
            animation: 
                cyberpunk-glitch 2s step-end 5s forwards,
                skew-span 2s step-end 5s forwards,
                hide-after-glitch 100ms ease 7s forwards;
        }

        @keyframes skew-glitch {
            0% { font-family: "cyberpunk"; text-transform: uppercase; color: #e4b124; letter-spacing: -0.05em; transform: skew(83deg, 2deg) scale(.25); }
            27% { transform: skew(-83deg, 2deg) scale(.25); }
            66% { transform: skew(93deg, -2deg) scale(.25); }
            91% { transform: skew(83deg, 2deg) scale(.25); }

            1%, 28%, 67%, 92% { transform: none; }
        }

        @keyframes cyberpunk-glitch {
            0%  { clip-path: polygon(29% 30%,35% 29%,96% 35%,27% 64%,42% 45%,52% 54%,40% 22%,8% 70%,18% 38%,35% 76%,34% 26%,25% 15%,9% 92%,68% 9%,52% 34%,34% 48%,50% 73%,84% 83%,65% 87%,53% 86%,60% 16%,65% 27%,32% 29%,80% 37%,21% 19%,24% 58%); }
            4%  { clip-path: polygon(80% 18%,92% 88%,99% 25%,99% 91%,48% 61%,40% 71%,22% 97%,86% 56%,74% 37%,10% 63%,51% 43%,30% 22%,35% 75%,77% 10%,66% 23%,48% 13%,76% 0%,64% 82%,43% 88%,29% 78%,12% 23%,80% 51%,84% 3%,53% 90%,66% 52%,63% 69%); }
            27% { clip-path: polygon(83% 9%,34% 76%,44% 5%,27% 26%,59% 71%,21% 41%,8% 84%,88% 40%,99% 46%,58% 87%,57% 53%,94% 76%,65% 33%,60% 38%,31% 28%,91% 19%,25% 98%,16% 29%,78% 4%,75% 81%,83% 88%,9% 48%,42% 14%,37% 78%,5% 40%,50% 44%); }
            51% { clip-path: polygon(94% 29%,50% 59%,73% 73%,76% 29%,88% 49%,40% 34%,92% 49%,45% 43%,61% 85%,86% 52%,43% 73%,28% 53%,11% 69%,19% 38%,43% 86%,46% 28%,53% 94%,32% 29%,32% 17%,100% 62%,78% 59%,93% 32%,42% 95%,62% 68%,20% 89%,50% 4%); }
            66% { clip-path: polygon(37% 55%,17% 86%,70% 34%,12% 63%,85% 31%,80% 19%,5% 65%,71% 38%,8% 48%,74% 38%,10% 58%,97% 5%,78% 17%,92% 61%,78% 49%,60% 25%,25% 39%,42% 84%,38% 67%,3% 23%,42% 66%,41% 25%,43% 28%,67% 16%,1% 12%,45% 67%); }
            91% { clip-path: polygon(73% 80%,73% 44%,95% 80%,44% 25%,59% 100%,74% 65%,41% 10%,70% 16%,36% 94%,82% 19%,79% 71%,94% 59%,93% 95%,81% 53%,19% 59%,97% 57%,51% 94%,22% 42%,91% 89%,39% 59%,89% 60%,13% 13%,52% 53%,64% 12%,73% 3%,80% 60%); }

            1%, 5%, 28%, 53%, 67%, 92% {
                clip-path: none;
            }
        }

        @keyframes change-text {
            0% { content: 'Cyberpunk'; }
            100% { content: 'Cyberpunk'; }
        }

        @keyframes skew-span {
            0% { color: #e4b124; transform: skew(83deg, 2deg) scale(.25); }
            27% { transform: skew(-83deg, 2deg) scale(.25); }
            66% { transform: skew(93deg, -2deg) scale(.25); }
            91% { transform: skew(83deg, 2deg) scale(.25); }

            1%, 28%, 67%, 92% { transform: none; }
        }

        @keyframes hide-after-glitch {
            0% { opacity: 0; transform: scale(1); position: absolute; }
            100% { opacity: 0; transform: scale(0); position: absolute; }
        }
    }
</style>
