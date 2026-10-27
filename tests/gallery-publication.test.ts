import test from 'node:test';
import assert from 'node:assert/strict';
import {GALLERY_PROJECTS,UNPUBLISHED_GALLERY_CONCEPTS,FEATURED_PROPERTY_IMAGES,getFeaturedGalleryProject,getGalleryProjectsForCity,getGalleryProjectsFor} from '../shared/galleryData';
test('generated comparisons stay retained but cannot enter public gallery consumers',()=>{
 assert.ok(UNPUBLISHED_GALLERY_CONCEPTS.length>0);assert.deepEqual(GALLERY_PROJECTS,[]);
 for(const p of UNPUBLISHED_GALLERY_CONCEPTS){assert.equal(getFeaturedGalleryProject(p.serviceType),undefined);assert.deepEqual(getGalleryProjectsForCity(p.city),[]);assert.deepEqual(getGalleryProjectsFor(p.serviceType,p.city),[]);}
 assert.ok(FEATURED_PROPERTY_IMAGES.boiseBungalowExterior);
});
