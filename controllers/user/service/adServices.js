// adServices.js أو أي ملف خدمة مستقل
// هذا فنكشل لتحويل رقم الواتساب إلا رابط لتم تخزينه كرابط والتساب مباشر 
function convertToWhatsAppLink(value) {
  if (!value) return '';

  let raw = value.trim();

  // إزالة أي رموز أو فراغات غير رقمية (مثل + أو - أو مسافات)
  raw = raw.replace(/[^\d]/g, '');

  // إذا كان يبدأ بصفر، نحذفه
  if (raw.startsWith('0')) {
    raw = raw.slice(1);
  }

  // الآن نضيف '966' في جميع الأحوال
  raw = '966' + raw;

  // بناء الرابط بصيغة wa.me
  return `https://wa.me/${raw}`;
}

// تحول الصيغه إلا صيغت اتصال 
function convertTophoneNumber(value) {
  if (!value) return '';

  let raw = value.trim();

  // إزالة أي رموز أو فراغات غير رقمية (مثل + أو - أو مسافات)
  raw = raw.replace(/[^\d]/g, '');

  // إذا كان يبدأ بصفر، نحذفه
  if (raw.startsWith('0')) {
    raw = raw.slice(1);
  }

  // الآن نضيف '966' في جميع الأحوال
  raw = '+966' + raw;

  return `${raw}`;
}



function updateAdFields(ad, body) {
    // 1) حقول نصية (strings)
    if (body.status !== undefined)       ad.status = body.status; // "مسودة" أو "منشور"...
    if (body.title !== undefined)        ad.title = body.title;
    if (body.adNumber !== undefined)        ad.adNumber = body.adNumber;

    
    if (body.adType !== undefined)       ad.adType = body.adType;
    if (body.city !== undefined)         ad.city = body.city;
    if (body.address !== undefined)      ad.address = body.address;
    if (body.category !== undefined)     ad.category = body.category;
    
    // (جديد) تعامل خاص لـ subCategory
    if (body.subCategory !== undefined) {
      // نفترض أن schema يتوقع كائن subCategory = { label, id, labelEn }
      let val = body.subCategory;
  
      // لو جاءت كـ JSON string
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch (err) {
          console.error('subCategory is invalid JSON:', val);
          val = { label: '', id: 0, labelEn: '' };
        }
      }
      // تأكد أنها كائن
      if (typeof val === 'object' && val !== null) {
        ad.subCategory = val;
      }
    }
  
    if (body.propertyType !== undefined) ad.propertyType = body.propertyType;
    if (body.propertyDetails !== undefined)  ad.propertyDetails = body.propertyDetails;
    if (body.locationType !== undefined) ad.locationType = body.locationType; // "precise" or "approximate"
    if (body.district !== undefined)     ad.district = body.district;
    if (body.region !== undefined)       ad.region = body.region;
    if (body.country !== undefined)      ad.country = body.country;
    if (body.disputes !== undefined)     ad.disputes = body.disputes;
    if (body.obligations !== undefined)  ad.obligations = body.obligations;
    if (body.youtubeLink !== undefined)  ad.youtubeLink = body.youtubeLink;
    if (body.tiktokLink !== undefined)   ad.tiktokLink = body.tiktokLink;
    if (body.description !== undefined)  ad.description = body.description;
    if (body.phoneNumber !== undefined) {
      ad.phoneNumber = convertTophoneNumber(body.phoneNumber);
    }
    if (body.whatsappNumber !== undefined) {
      ad.whatsappNumber = convertToWhatsAppLink(body.whatsappNumber);
    }
    
    
    // if (body.statusText !== undefined)   ad.statusText = body.statusText;
    if (!ad.statusText) {
        // إذا لم يكن هناك أي قيمة سابقة في قاعدة البيانات
        ad.statusText = 'متاح';
      }
      
    // 2) حقول رقمية (number)
    // يُفضل تحويلها من نص إلى رقم باستخدام Number(...)

    if (body.discountPrice !== undefined)   ad.discountPrice = body.discountPrice;

 
          if (body.landArea !== undefined)        ad.landArea = Number(body.landArea);
    if (body.streetWidth !== undefined)     ad.streetWidth = Number(body.streetWidth);
    if (body.streetCount !== undefined)     ad.streetCount = Number(body.streetCount);
    if (body.floorsCount !== undefined)     ad.floorsCount = Number(body.floorsCount);
    if (body.bedrooms !== undefined)        ad.bedrooms = Number(body.bedrooms);
    if (body.bathrooms !== undefined)       ad.bathrooms = Number(body.bathrooms);
    if (body.laundryRooms !== undefined)    ad.laundryRooms = Number(body.laundryRooms);
    if (body.cinemaHall !== undefined)      ad.cinemaHall = Number(body.cinemaHall);
    if (body.gym !== undefined)            ad.gym = Number(body.gym);
    if (body.surroundingStreetsCount !== undefined) ad.surroundingStreetsCount = Number(body.surroundingStreetsCount);
    if (body.maidRooms !== undefined)      ad.maidRooms = Number(body.maidRooms);
    if (body.propertyAge !== undefined)     ad.propertyAge = body.propertyAge;
    if (body.buildingSize !== undefined)    ad.buildingSize = Number(body.buildingSize);
    if (body.landSize !== undefined)        ad.landSize = Number(body.landSize);
    if (body.lat !== undefined) {
        ad.lat = Number(body.lat);
      }
      
      if (body.lng !== undefined) {
        ad.lng = Number(body.lng);
      }
      
  
    if (body.price !== undefined) {
      const parsedPrice = Number(body.price);
      if (!Number.isNaN(parsedPrice)) {
        ad.price = parsedPrice;
      }
      // else: تجاهل أو ضع قيمة افتراضية
    }

      
    if (body.originalPrice !== undefined)   ad.originalPrice = body.originalPrice;
    if (body.views !== undefined)           ad.views = Number(body.views);
  
    // 3) حقول منطقية (boolean)
    // لو تصلك كـ "true"/"false" نصياً، حوّلها إلى Boolean
    if (body.frequentProperty !== undefined) {
      ad.frequentProperty = (body.frequentProperty === 'true');
    }
    if (body.swimmingPool !== undefined) {
      ad.swimmingPool = (body.swimmingPool);
    }
    if (body.cameras !== undefined) {
      ad.cameras = (body.cameras );
    }
    if (body.balcony !== undefined) {
      ad.balcony = (body.balcony );
    }
    if (body.elevator !== undefined) {
      ad.elevator = (body.elevator  );
    }
    if (body.storage !== undefined) {
      ad.storage = (body.storage  );
    }
    if (body.garage !== undefined) {
      ad.garage = (body.garage );
    }

    if (body.isPriceNegotiable !== undefined) {
      ad.isPriceNegotiable = Boolean(body.isPriceNegotiable);
    }


    if (body.acceptMortgage !== undefined) {
        ad.acceptMortgage = Boolean(body.acceptMortgage);
      }
      
      if (body.canDispose !== undefined) {
        ad.canDispose = Boolean(body.canDispose);
      }
      
    if (body.isFeatured !== undefined) {
      ad.isFeatured = Boolean(body.isFeatured);
    }
  
    // 4) مصفوفات (services, directions)
    if (body.services !== undefined) {
      try {
        const val = (typeof body.services === 'string')
          ? JSON.parse(body.services)
          : body.services;
        if (Array.isArray(val)) {
          ad.services = val;
        }
      } catch (err) {
        // تجاهل أو تعامل مع الخطأ
      }
    }
  
    if (body.directions !== undefined) {
      try {
        const val = (typeof body.directions === 'string')
          ? JSON.parse(body.directions)
          : body.directions;
        if (Array.isArray(val)) {
          ad.directions = val;
        }
      } catch (err) {
        // تجاهل أو تعامل مع الخطأ
      }
    }
  
    // 5) features (غالباً كائن يحوي rooms, bathrooms, size)
    if (body.features !== undefined) {
      try {
        const val = (typeof body.features === 'string')
          ? JSON.parse(body.features)
          : body.features;
        if (typeof val === 'object' && val !== null) {
          if (val.rooms !== undefined) {
            ad.features.rooms = Number(val.rooms);
          }
          if (val.bathrooms !== undefined) {
            ad.features.bathrooms = Number(val.bathrooms);
          }
          if (val.size !== undefined) {
            ad.features.size = Number(val.size);
          }
        }
      } catch (err) {
        // تجاهل أو تعامل مع الخطأ
      }
    }
  
    return ad;
  }
  
  module.exports = { updateAdFields };
  
