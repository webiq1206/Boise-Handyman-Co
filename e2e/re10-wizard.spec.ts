import {test,expect} from '@playwright/test';

// The RE-10 app: one question first, then either the framed P5 instant estimator
// (tap repairs, on-screen range from the estimator itself) or the shared document
// intake. No extraction is called and no lead is submitted.
for(const width of [320,390,1440])test(`RE-10 app paths at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local test: persistence unavailable"}'}));
 await page.route('https://p5homeco.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<html><body>estimator</body></html>'}));
 await page.goto('/re-10-repairs-boise');
 const app=page.locator('#re10-wizard');
 await expect(app.getByRole('heading',{name:'How do you want to price your RE-10?'})).toBeVisible();
 await expect(app.getByText('Start here')).toBeVisible();
 await expect(app.getByTestId('re10-app-call')).toHaveAttribute('href',/^tel:/);
 await expect(app.getByTestId('re10-app-text')).toHaveAttribute('href',/^sms:/);
 for(const choice of ['re10-choose-price','re10-choose-send']){const box=await app.getByTestId(choice).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(72);}

 await app.getByTestId('re10-choose-price').click();
 await expect(app.getByText('Tap your repairs')).toBeVisible();
 const frame=app.locator('iframe');
 await expect(frame).toHaveAttribute('src',/^https:\/\/p5homeco\.com\/estimator\/embed\?.*brand=handyman.*project=handyman/);

 await app.getByRole('button',{name:'Send your RE-10 instead'}).click();
 await expect(app.getByRole('heading',{name:'Send your RE-10'})).toBeVisible();
 const scope=app.getByRole('textbox',{name:'Tell us about your project',exact:true});
 await scope.fill('TEST ONLY: Repair the inspection-listed door.');
 await expect(app.getByRole('button',{name:'Attach files',exact:true})).toBeVisible();

 await app.getByRole('button',{name:'Back to the first step'}).click();
 await expect(app.getByRole('heading',{name:'How do you want to price your RE-10?'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('RE-10 hash opens the send path',async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
 await page.goto('/re-10-repairs-boise#re10-send');
 await expect(page.locator('#re10-wizard').getByRole('heading',{name:'Send your RE-10'})).toBeVisible();
});
