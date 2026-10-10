const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests',
 timeout:30000,
 use:{baseURL:process.env.PHONIKA_TEST_BASE_URL || 'https://olga-pad.github.io/phonika-ru/',trace:'on-first-retry'},
 projects:[{name:'webkit',use:{...devices['Desktop Safari'],browserName:'webkit'}},{name:'webkit-mobile',use:{...devices['iPhone 13'],browserName:'webkit'}}]
});
