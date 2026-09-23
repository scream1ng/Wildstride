import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 timeout:45000,
 expect:{timeout:10000},
 fullyParallel:false,
 workers:1,
 reporter:'list',
 outputDir:'.artifacts/test-results',
 use:{baseURL:'http://localhost:3000',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,trace:'retain-on-failure'},
 projects:[
  {name:'mobile-chromium',use:{browserName:'chromium',channel:'chrome'}},
  {name:'mobile-webkit',use:{browserName:'webkit'}}
 ],
 webServer:{command:'npm start',url:'http://localhost:3000',reuseExistingServer:true}
});
