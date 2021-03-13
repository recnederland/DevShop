require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");

const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const stripe = require("stripe")(process.env.STRIPE);

const app = express();
// cors : farklı klasördeki uygulamaları birbirine bağlar
app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const cors = require("cors");
app.use(fileUpload());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD, PUT, PATCH, POST, DELETE",
    credentials: true,
  })
);

const Schema = mongoose.Schema;

mongoose.connect(process.env.BAGLANTI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
app.use(
  session({
    secret: "Techproeducation - WebDeveloper",
    resave: true,
    saveUninitialized: true,
    name: "kullanici_bilgileri",
    proxy: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

///////// MONGODB ŞEMALARI - BAŞLANGIÇ
const urunSema = {
  isim: String,
  kategori: String,
  kategori_url: String,
  resimler: {
    bir: String,
    iki: String,
    uc: String,
    dort: String,
  },
  stok: {
    s: Number,
    m: Number,
    l: Number,
    xl: Number,
  },
  marka: String,
  aciklama: String,
  ind_fiyat: Number,
  normal_fiyat: Number,
  yildiz: {
    sayi: Number,
    puan: String,
  },
  renk: String,
  parametreler: {
    taksit: String,
    garanti: String,
    kargo: String,
  },
  satilma: Number,
  cinsiyet: String,
};

const yorumSema = {
  urun_id: String,
  isim: String,
  icerik: String,
  tarih: String,
  kullanici_id: String,
  yildiz: Number,
  onay: Number,
  like: Number,
  dislike: Number,
};

const kategoriSema = {
  kategori_isim: String,
  kategori_url: String,
  kategori_aciklama: String,
};

const kullaniciSema = new mongoose.Schema({
  isim: String,
  soyisim: String,
  email: String,
  sifre: String,
  adres: String,
  telefon: String,
  cinsiyet: String,
  engel: Number,
});
// passport local mongoose'a kullanici şemasındaki kullanıcı adı ve şifre bölümlerini tanıttık ki
// kayıt işlemlerinde, şifreyeleyeceği alanı bilsin. giriş işlemlerinde de kontrol edeceği alanları bilsin.
kullaniciSema.plugin(passportLocalMongoose, {
  usernameField: "email",
  passwordField: "sifre",
});

const siparisSema = {
  takip_no: String,
  tutar: Number,
  kullanici_id: String,
  urunler: [],
  odeme_id: String,
  tarih: Date,
  sonuc: Boolean,
  durum: [],
  iletisim: [],
  adres: String,
};

const duyuruSema = {
  tarih: String,
  duyuru: String,
};

///////// MONGODB ŞEMALARI - BİTİŞ

///////// MONGODB MODELLERİ - BAŞLANGIÇ
const Urun = mongoose.model("Urun", urunSema);
const Yorum = mongoose.model("Yorum", yorumSema);
const Kategori = mongoose.model("Kategori", kategoriSema);
const Kullanici = mongoose.model("Kullanici", kullaniciSema);
passport.use(Kullanici.createStrategy());
const Siparis = mongoose.model("Siparis", siparisSema);
const Duyuru = mongoose.model("Duyuru", duyuruSema);

// Tarayıcıda cookie oluşturacak
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// Tarayıcıdan cookie alıp kullanıcı kontrol işlemi gerçekleştireceğiz.
passport.deserializeUser(function (id, done) {
  Kullanici.findById(id, function (err, user) {
    done(err, user);
  });
});
///////// MONGODB MODELLERİ - BİTİŞ

app.get("/", function (req, res) {
  res.send("Başarılı..");
});

//////////////////////////                  URUN              /////////////////////////////
app.post("/api/urun/olusturma", function (req, res) {
  var urun = new Urun({
    isim: "Polo Gömlek",
    kategori: "Gömlek",
    kategori_url: "gomlek",
    resimler: {
      bir: "/images/items/3.jpg",
      iki: "/images/items/1.jpg",
      uc: "/images/items/1.jpg",
      dort: "/images/items/4.jpg",
    },
    stok: {
      s: 9,
      m: 9,
      l: 9,
      xl: 9,
    },
    marka: "Süvari",
    aciklama:
      "Virgil Abloh’s Off-White is a streetwear-inspired collection that continues to break away from the conventions of mainstream fashion. Made in Italy, these black and brown Odsy-1000 low-top sneakers.",
    ind_fiyat: 29.99,
    normal_fiyat: 39.99,
    yildiz: {
      sayi: 20,
      puan: "4.4",
    },
    renk: "Mavi",
    parametreler: {
      taksit: "12 Taksit",
      garanti: "1 Yıl",
      kargo: "Ücretsiz",
    },
    satilma: 50,
    cinsiyet: "Erkek",
  });

  urun.save(function (err) {
    if (!err) {
      res.send([
        {
          sonuc: "başarılı",
        },
      ]);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.get("/api/urun/detay/:id", function (req, res) {
  Urun.find({ _id: req.params.id }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.get("/api/urun/benzerurunler/:kategori_url/:urunid", function (req, res) {
  Urun.find(
    {
      kategori_url: req.params.kategori_url,
      _id: { $nin: req.params.urunid },
    },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send([
          {
            sonuc: "hata",
          },
        ]);
      }
    }
  )
    .sort({ satilma: -1 })
    .limit(4);
});

/////////////////////////            KATEGORİ SAYFASI           /////////////////////////////
app.get("/api/kategori/:kategori_url/:bulundugu_sayfa", function (req, res) {
  var sayfa = req.params.bulundugu_sayfa;
  var secim = req.query.secim;
  var markalar =
    req.query.marka === null || req.query.marka === "" ? "" : req.query.marka;

  var minFiyat = parseInt(req.query.min);
  var maxFiyat = parseInt(req.query.max);

  var aramaKriterleri = {
    kategori_url: req.params.kategori_url,
  };

  if (markalar !== "") {
    var bosArray = markalar.split(",");
    if (bosArray.length > 0) {
      aramaKriterleri["marka"] = {
        $in: bosArray,
      };
    }
  }

  if (minFiyat > 0 && maxFiyat === 0) {
    maxFiyat = 99999999999;
  }

  if ((minFiyat === 0 && maxFiyat > 0) || (minFiyat > 0 && maxFiyat > 0)) {
    aramaKriterleri["ind_fiyat"] = {
      $gt: minFiyat,
      $lt: maxFiyat,
    };
  }

  var kriter = {};

  if (secim === "1") {
    kriter = {
      _id: -1,
    };
  } else if (secim === "2") {
    kriter = {
      satilma: -1,
    };
  } else if (secim === "3") {
    kriter = {
      ind_fiyat: 1,
    };
  }

  Urun.find(aramaKriterleri, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort(kriter)
    .limit(6)
    .skip((sayfa - 1) * 6);
});

app.get("/api/urunsayisi/:kategori_url", function (req, res) {
  var markalar =
    req.query.marka === null || req.query.marka === "" ? "" : req.query.marka;

  var minFiyat = parseInt(req.query.min);
  var maxFiyat = parseInt(req.query.max);

  var aramaKriterleri = {
    kategori_url: req.params.kategori_url,
  };

  if (markalar !== "") {
    var bosArray = markalar.split(",");
    if (bosArray.length > 0) {
      aramaKriterleri["marka"] = {
        $in: bosArray,
      };
    }
  }

  if (minFiyat > 0 && maxFiyat === 0) {
    maxFiyat = 99999999999;
  }

  if ((minFiyat === 0 && maxFiyat > 0) || (minFiyat > 0 && maxFiyat > 0)) {
    aramaKriterleri["ind_fiyat"] = {
      $gt: minFiyat,
      $lt: maxFiyat,
    };
  }

  Urun.find(aramaKriterleri, function (err, gelenVeri) {
    if (!err) {
      res.send({
        toplam: gelenVeri.length,
      });
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.get("/api/kategori/filtre/marka/:kategori_url", function (req, res) {
  Urun.distinct("marka", function (err, gelenVeri) {
    if (!err) res.send(gelenVeri);
    else res.send(err);
  });
});

/////////////////////////             POPÜLER ÜRÜNLER           //////////////////////////////
app.get("/api/populerurunler", function (req, res) {
  Urun.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort({ satilma: -1 })
    .limit(4);
});

//////////////////////////             YENİ ÜRÜNLER             ///////////////////////////////
app.get("/api/yeniurunler", function (req, res) {
  Urun.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort({ _id: -1 })
    .limit(4);
});

////////////////////////               YORUMLAR                ////////////////////////////////
app.get("/api/yorumlar/:id", function (req, res) {
  Yorum.find({ urun_id: req.params.id, onay: 1 }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.post("/api/yorum", function (req, res) {
  var tarih = new Date();
  var yeniTarih =
    tarih.getFullYear() + "/" + (tarih.getMonth() + 1) + "/" + tarih.getDate();

  var yorum = new Yorum({
    urun_id: req.body.urun_id,
    isim: req.body.isim,
    icerik: req.body.icerik,
    tarih: yeniTarih,
    kullanici_id: req.body.kullanici_id,
    yildiz: req.body.yildiz,
    onay: 0,
    like: 0,
    dislike: 0,
  });

  yorum.save(function (err) {
    if (!err) {
      res.send({ sonuc: true });
    } else {
      res.send({ sonuc: "hata" });
    }
  });
});

// id'si bilinen bir ürüne yapılan yorumların "yildiz" fieldında rakamların toplamı (sum).
// id'si bilinen ürüne yapılan toplam yorum sayısı (yorumsayisi)
app.get("/api/yorum/puan/:id", function (req, res) {
  Yorum.aggregate([
    {
      $match: {
        urun_id: req.params.id,
        onay: 1,
      },
    },
    {
      $group: {
        _id: new mongoose.Types.ObjectId("60369eb50391e42b105be0f2"),
        sum: { $sum: "$yildiz" },
        yorumsayisi: { $sum: 1 },
      },
    },
  ]).then(function (gelenVeri) {
    console.log(gelenVeri[0]);
    res.send(gelenVeri[0]);
  });
});
///// **** ONAY : 1 ayarlaması yapılacak

/////////////////////////////   KATEGORİ API     ///////////////

app.post("/api/kategori_bireysel/olustur", function (req, res) {
  var kategori = new Kategori({
    kategori_isim: req.body.isim,
    kategori_url: req.body.url,
    kategori_aciklama: req.body.aciklama,
  });

  kategori.save(function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send(err);
    }
  });
});

app.get("/api/kategori_bireysel/:kategori_url", function (req, res) {
  Kategori.find(
    { kategori_url: req.params.kategori_url },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send([
          {
            sonuc: "hata",
          },
        ]);
      }
    }
  );
});

app.get("/api/kategori_liste", function (req, res) {
  Kategori.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

////////////////////////              KULLANICI İŞLEMLERİ     //////////////////////////////
app.post("/api/kullanici/olusturma", function (req, res) {
  Kullanici.register(
    {
      isim: req.body.isim,
      soyisim: req.body.soyisim,
      email: req.body.email,
      adres: req.body.adres,
      telefon: req.body.telefon,
      cinsiyet: req.body.cinsiyet,
      engel: 0,
    },
    req.body.sifre,
    function (err, gelenVeri) {
      if (err) {
        if (err.name === "UserExistsError") {
          res.send({ sonuc: "email" });
        } else {
          res.send({ sonuc: "hata" });
        }
      } else {
        passport.authenticate("local")(req, res, function () {
          res.send({ sonuc: "başarılı" });
        });
      }
    }
  );
});

app.post("/api/kullanici/giris", function (req, res) {
  const kullanici = new Kullanici({
    email: req.body.email,
    sifre: req.body.sifre,
  });

  req.login(kullanici, function (err) {
    if (err) {
      res.send({
        sonuc: false,
      });
    } else
      passport.authenticate("local")(req, res, function () {
        if (req.user.engel === 1) {
          req.logout();
          res.send({
            sonuc: false,
          });
        } else {
          res.send({
            sonuc: true,
          });
        }
      });
  });
});

app.get("/api/kullanici/cikis", function (req, res) {
  req.logout();
  res.send({ sonuc: "başarılı" });
});

app.get("/api/kullanici/giriskontrol", function (req, res) {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.send({ sonuc: true, isim: req.user.isim, id: req.user._id });
  } else {
    res.send({ sonuc: false });
  }
});

app.get("/api/kullanici/bilgiler", function (req, res) {});

/////////////////////////////        ÖDEME İŞLEMLERİ         ///////////////////////////
const calculateOrderAmount = (items) => {
  var toplam = 0;
  items.forEach((element) => {
    toplam += parseInt(element.fiyat * 100) * element.miktar;
  });

  return toplam;
};
app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

////////////////////////////      SİPARİŞ İŞLEMLERİ          ///////////////////////////
app.post("/api/siparis/olustur", function (req, res) {
  const urunler = req.body.urunler;
  const odeme_id = req.body.odemeid;

  const adres = req.body.adres;
  const iletisim = req.body.iletisim;

  const kullanici_id = req.user._id;

  const tarih = new Date();
  const takip_no =
    tarih.getFullYear() +
    "" +
    (tarih.getMonth() + 1) +
    "" +
    tarih.getDate() +
    "-" +
    parseInt(Math.random() * 90000 + 1000);
  const tutar = calculateOrderAmount(urunler) / 100;

  var siparis = new Siparis({
    tutar: tutar,
    urunler: urunler,
    takip_no: takip_no,
    tarih: tarih,
    sonuc: false,
    odeme_id: odeme_id,
    kullanici_id: kullanici_id,
    adres: adres,
    iletisim: iletisim,
  });

  siparis.save(function (err) {
    if (!err) {
      res.send({
        sonuc: true,
        takip_no: takip_no,
      });
    } else {
      res.send({
        sonuc: false,
      });
    }
  });
});

////////////////////////    PROFİL İŞLEMLERİ      ////////

app.get("/api/profil/bilgiler", function (req, res) {
  res.send(req.user);
});

app.patch("/api/profil/bilgiler", function (req, res) {
  Kullanici.updateOne(
    { _id: req.user._id },
    {
      $set: req.body,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.get("/api/profil/aktifsiparis", function (req, res) {
  Siparis.find(
    {
      kullanici_id: req.user._id,
      sonuc: false,
    },
    function (err, gelenVeri) {
      if (err) {
        res.send({ sonuc: "hata" });
      } else {
        res.send(gelenVeri);
      }
    }
  );
});

app.get("/api/profil/siparisgecmisi", function (req, res) {
  Siparis.find(
    {
      kullanici_id: req.user._id,
    },
    function (err, gelenVeri) {
      if (err) {
        res.send({ sonuc: "hata" });
      } else {
        res.send(gelenVeri);
      }
    }
  );
});

app.post("/api/profil/sifreguncelle", function (req, res) {
  var email = req.user.email;
  var newPasswordString = req.body.sifre;

  Kullanici.findByUsername(email).then(
    function (sanitizedUser) {
      if (sanitizedUser) {
        sanitizedUser.setPassword(newPasswordString, function () {
          sanitizedUser.save();
          res.status(200).json({ sonuc: true });
        });
      } else {
        res.status(500).json({ sonuc: false });
      }
    },
    function (err) {
      res.status(500).json({ sonuc: false });
    }
  );
});

///////////////////////     ADMİN PANELİ   ////////////////
app.get("/admin/api/populerurunler", function (req, res) {
  Urun.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort({ satilma: -1 })
    .limit(10);
});

app.delete("/admin/api/urunsil", function (req, res) {
  Urun.deleteOne({ _id: req.query.id }, function (err, gelenVeri) {
    if (!err) {
      res.send({ sonuc: true });
    } else {
      res.send({ sonuc: false });
    }
  });
});

app.get("/admin/api/sonyorumlar", function (req, res) {
  Yorum.find({ onay: 0 }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort({ _id: -1 })
    .limit(5);
});

app.patch("/admin/api/yorum_islem", function (req, res) {
  var yorumId = req.query.id;
  var onay = req.query.onay;

  Yorum.updateOne(
    { _id: yorumId },
    {
      $set: { onay: onay },
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.get("/admin/api/son_siparisler", function (req, res) {
  Siparis.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort({ _id: -1 })
    .limit(7);
});

app.post("/admin/api/urunolustur", async function (req, res) {
  const tarih = new Date();
  const rastgeleSayi = tarih.getTime();

  if (!req.files) {
    return console.log("Resim Eklenmeli");
  }

  console.log(req.files.dosya1);

  var dosya1isim = rastgeleSayi + "-" + req.body.kategori_url + "-1.jpg";
  var dosya2isim = rastgeleSayi + "-" + req.body.kategori_url + "-2.jpg";
  var dosya3isim = rastgeleSayi + "-" + req.body.kategori_url + "-3.jpg";
  var dosya4isim = rastgeleSayi + "-" + req.body.kategori_url + "-4.jpg";

  await req.files.dosya1.mv(
    `${__dirname}/public/dosyalar/resimler/${dosya1isim}`
  );
  await req.files.dosya2.mv(
    `${__dirname}/public/dosyalar/resimler/${dosya2isim}`
  );
  await req.files.dosya3.mv(
    `${__dirname}/public/dosyalar/resimler/${dosya3isim}`
  );
  await req.files.dosya4.mv(
    `${__dirname}/public/dosyalar/resimler/${dosya4isim}`
  );

  var urun = new Urun({
    isim: req.body.isim,
    kategori: req.body.kategori,
    kategori_url: req.body.kategori_url,
    resimler: {
      bir: "http://localhost:5000/dosyalar/resimler/" + dosya1isim,
      iki: "http://localhost:5000/dosyalar/resimler/" + dosya2isim,
      uc: "http://localhost:5000/dosyalar/resimler/" + dosya3isim,
      dort: "http://localhost:5000/dosyalar/resimler/" + dosya4isim,
    },
    stok: {
      s: req.body.s,
      m: req.body.m,
      l: req.body.l,
      xl: req.body.xl,
    },
    marka: req.body.marka,
    aciklama: req.body.aciklama,
    ind_fiyat: req.body.ind_fiyat,
    normal_fiyat: req.body.normal_fiyat,
    yildiz: {
      sayi: 0,
      puan: 0,
    },
    renk: req.body.renk,
    parametreler: {
      taksit: "String",
      garanti: "String",
      kargo: "String",
    },
    satilma: 0,
    cinsiyet: req.body.cinsiyet,
  });

  urun.save(function (err) {
    if (!err) {
      res.send({
        sonuc: "başarılı",
      });
    } else {
      res.send({
        sonuc: "hata",
      });
    }
  });
});

app.get("/admin/api/tumurunler", function (req, res) {
  Urun.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.patch("/api/kategori_bireysel/guncelle", function (req, res) {
  console.log(req.query.id);
  console.log(req.body);
  Kategori.updateOne(
    { _id: req.query.id },
    {
      $set: req.body,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.delete("/api/kategori_bireysel/sil", function (req, res) {
  Kategori.deleteOne({ _id: req.query.id }, function (err, gelenVeri) {
    if (!err) {
      res.send({ sonuc: true });
    } else {
      res.send({ sonuc: false });
    }
  });
});

app.get("/admin/api/tumyorumlar", function (req, res) {
  const sayfa = req.query.sayfa;
  Yorum.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .limit(25)
    .skip((sayfa - 1) * 25)
    .sort({ _id: -1 });
});

app.get("/admin/api/tum_kullanicilar", function (req, res) {
  Kullanici.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send({
        sonuc: "hata",
      });
    }
  });
});

app.patch("/admin/api/kullanici_engel", function (req, res) {
  Kullanici.updateOne(
    { _id: req.body.id },
    { $set: req.body },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send({
          sonuc: "hata",
        });
      }
    }
  );
});

app.get("/admin/api/tum_siparisler", function (req, res) {
  var sayfa = req.query.sayfa;
  Siparis.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .limit(50)
    .skip((sayfa - 1) * 50)
    .sort({ _id: -1 });
});

app.get("/admin/api/siparis_bireysel", function (req, res) {
  var id = req.query.id;
  Siparis.find({ _id: id }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.patch("/admin/api/siparis_durum_guncelle", function (req, res) {
  var id = req.body.id;
  var durum = req.body.durum;

  Siparis.updateOne(
    { _id: id },
    {
      $set: {
        durum: durum,
      },
    },
    function (err, gelenVeri) {
      if (!err) {
        res.send({
          sonuc: true,
        });
      } else {
        res.send({
          sonuc: false,
        });
      }
    }
  );
});

app.patch("/admin/api/siparis_teslim", function (req, res) {
  var id = req.body.id;
  var durum = req.body.durum;

  Siparis.updateOne(
    { _id: id },
    {
      $set: {
        durum: durum,
        sonuc: true,
      },
    },
    function (err, gelenVeri) {
      if (!err) {
        res.send({
          sonuc: true,
        });
      } else {
        res.send({
          sonuc: false,
        });
      }
    }
  );
});

app.get("/admin/api/duyuru", function (req, res) {
  Duyuru.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send({
        sonuc: false,
      });
    }
  })
    .limit(4)
    .sort({ _id: -1 });
});

app.post("/admin/api/duyuru", function (req, res) {
  var duyuru = new Duyuru({
    tarih: req.body.tarih,
    duyuru: req.body.duyuru,
  });

  duyuru.save(function (err) {
    if (!err) {
      res.send({
        sonuc: true,
      });
    } else {
      res.send({
        sonuc: false,
      });
    }
  });
});

app.get("/admin/api/aylik_satisozeti", function (req, res) {
  Siparis.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send({ sonuc: false });
    }
  }).sort({
    tarih: 1,
  });
});

app.patch("/admin/api/urunguncelle", async function (req, res) {
  const tarih = new Date();
  const rastgeleSayi = tarih.getTime();

  var dosya1isim = "";

  if (req.body.res1 !== "") {
    dosya1isim = req.body.res1;
  } else {
    eklenecek = rastgeleSayi + "-" + req.body.kategori_url + "-1.jpg";
    await req.files.dosya1.mv(
      `${__dirname}/public/dosyalar/resimler/${eklenecek}`
    );

    dosya1isim = "http://localhost:5000/dosyalar/resimler/" + eklenecek;
  }

  var dosya2isim = "";

  if (req.body.res2 !== "") {
    dosya2isim = req.body.res2;
  } else {
    eklenecek = rastgeleSayi + "-" + req.body.kategori_url + "-2.jpg";
    await req.files.dosya2.mv(
      `${__dirname}/public/dosyalar/resimler/${eklenecek}`
    );

    dosya2isim = "http://localhost:5000/dosyalar/resimler/" + eklenecek;
  }

  var dosya3isim = "";

  if (req.body.res3 !== "") {
    dosya3isim = req.body.res3;
  } else {
    eklenecek = rastgeleSayi + "-" + req.body.kategori_url + "-3.jpg";
    await req.files.dosya3.mv(
      `${__dirname}/public/dosyalar/resimler/${eklenecek}`
    );

    dosya3isim = "http://localhost:5000/dosyalar/resimler/" + eklenecek;
  }

  var dosya4isim = "";

  if (req.body.res4 !== "") {
    dosya4isim = req.body.res4;
  } else {
    eklenecek = rastgeleSayi + "-" + req.body.kategori_url + "-4.jpg";
    await req.files.dosya4.mv(
      `${__dirname}/public/dosyalar/resimler/${eklenecek}`
    );

    dosya4isim = "http://localhost:5000/dosyalar/resimler/" + eklenecek;
  }

  Urun.updateOne(
    { _id: req.body.id },
    {
      $set: {
        isim: req.body.isim,
        kategori: req.body.kategori,
        kategori_url: req.body.kategori_url,
        resimler: {
          bir: dosya1isim,
          iki: dosya2isim,
          uc: dosya3isim,
          dort: dosya4isim,
        },
        stok: {
          s: req.body.s,
          m: req.body.m,
          l: req.body.l,
          xl: req.body.xl,
        },
        marka: req.body.marka,
        aciklama: req.body.aciklama,
        ind_fiyat: req.body.ind_fiyat,
        normal_fiyat: req.body.normal_fiyat,
        renk: req.body.renk,
        cinsiyet: req.body.cinsiyet,
      },
    },
    function (err, gelenVeri) {
      if (!err) {
        res.send({ sonuc: true });
      }
    }
  );
});

app.listen(5000);