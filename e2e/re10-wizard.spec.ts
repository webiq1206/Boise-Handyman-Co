import {test,expect} from '@playwright/test';

// The retired RE-10-specific wizard has been replaced by the shared intake.
// Keep this public entry point covered without calling extraction or submitting a lead.
for(const width of [320,390,1440])test(`RE-10 intake and callback preserve scope at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local test: persistence unavailable"}'}));
 await page.goto('/re-10-repairs-boise');
 const estimator=page.locator('#re10-wizard');
 await expect(estimator.getByText('This page is for Inspection and RE-10 repairs.',{exact:false})).toBeVisible();
 const scope=estimator.getByRole('textbox',{name:'Tell us about your project',exact:true});
 await scope.fill('TEST ONLY: Repair the inspection-listed door. Preserve the existing trim.');
 const shortcut=estimator.getByRole('button',{name:'Just contact me',exact:true});
 await shortcut.click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await expect(dialog.getByText('This does not sign you up for marketing.',{exact:false})).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 await expect(shortcut).toBeFocused();
 await expect(scope).toHaveValue('TEST ONLY: Repair the inspection-listed door. Preserve the existing trim.');
 await expect(estimator.getByRole('button',{name:'Attach files',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
