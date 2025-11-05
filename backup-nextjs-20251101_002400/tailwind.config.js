"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                netapp: {
                    blue: '#0067C5',
                    orange: '#FF6B35',
                    gray: '#6B7280'
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
};
exports.default = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFpbHdpbmQuY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFpbHdpbmQuY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsTUFBTSxNQUFNLEdBQVc7SUFDckIsT0FBTyxFQUFFO1FBQ1Asc0NBQXNDO1FBQ3RDLDJDQUEyQztRQUMzQyxvQ0FBb0M7S0FDckM7SUFDRCxLQUFLLEVBQUU7UUFDTCxNQUFNLEVBQUU7WUFDTixNQUFNLEVBQUU7Z0JBQ04sTUFBTSxFQUFFO29CQUNOLElBQUksRUFBRSxTQUFTO29CQUNmLE1BQU0sRUFBRSxTQUFTO29CQUNqQixJQUFJLEVBQUUsU0FBUztpQkFDaEI7YUFDRjtZQUNELGVBQWUsRUFBRTtnQkFDZixpQkFBaUIsRUFBRSwyQ0FBMkM7Z0JBQzlELGdCQUFnQixFQUNkLGtFQUFrRTthQUNyRTtTQUNGO0tBQ0Y7SUFDRCxPQUFPLEVBQUUsRUFBRTtDQUNaLENBQUE7QUFDRCxrQkFBZSxNQUFNLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbmZpZyB9IGZyb20gJ3RhaWx3aW5kY3NzJ1xuXG5jb25zdCBjb25maWc6IENvbmZpZyA9IHtcbiAgY29udGVudDogW1xuICAgICcuL3NyYy9wYWdlcy8qKi8qLntqcyx0cyxqc3gsdHN4LG1keH0nLFxuICAgICcuL3NyYy9jb21wb25lbnRzLyoqLyoue2pzLHRzLGpzeCx0c3gsbWR4fScsXG4gICAgJy4vc3JjL2FwcC8qKi8qLntqcyx0cyxqc3gsdHN4LG1keH0nLFxuICBdLFxuICB0aGVtZToge1xuICAgIGV4dGVuZDoge1xuICAgICAgY29sb3JzOiB7XG4gICAgICAgIG5ldGFwcDoge1xuICAgICAgICAgIGJsdWU6ICcjMDA2N0M1JyxcbiAgICAgICAgICBvcmFuZ2U6ICcjRkY2QjM1JyxcbiAgICAgICAgICBncmF5OiAnIzZCNzI4MCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGJhY2tncm91bmRJbWFnZToge1xuICAgICAgICAnZ3JhZGllbnQtcmFkaWFsJzogJ3JhZGlhbC1ncmFkaWVudCh2YXIoLS10dy1ncmFkaWVudC1zdG9wcykpJyxcbiAgICAgICAgJ2dyYWRpZW50LWNvbmljJzpcbiAgICAgICAgICAnY29uaWMtZ3JhZGllbnQoZnJvbSAxODBkZWcgYXQgNTAlIDUwJSwgdmFyKC0tdHctZ3JhZGllbnQtc3RvcHMpKScsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtdLFxufVxuZXhwb3J0IGRlZmF1bHQgY29uZmlnXG4iXX0=