require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
// cors : farklı klasördeki uygulamaları birbirine bağlar

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET, PUT, PATCH, POST, DELETE",
    credentials: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const Schema = mongoose.Schema;

mongoose.connect(process.env.BAGLANTI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
  ind_fiyat: String,
  normal_fiyat: String,
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
  like: Number,
  dislike: Number,
};

///////// MONGODB ŞEMALARI - BİTİŞ

///////// MONGODB MODELLERİ - BAŞLANGIÇ
const Urun = mongoose.model("Urun", urunSema);
const Yorum = mongoose.model("Yorum", yorumSema);
///////// MONGODB MODELLERİ - BİTİŞ

app.get("/", function (req, res) {
  res.send("Başarılı..");
});

//////////////////////////                  URUN              /////////////////////////////
app.post("/api/urun/olusturma", function (req, res) {
  var urun = new Urun({
    isim: "Bu bir gömlektir",
    kategori: "Gömlek",
    kategori_url: "gomlek",
    resimler: {
      bir: "/images/items/1.jpg",
      iki: "/images/items/2.jpg",
      uc: "/images/items/3.jpg",
      dort: "/images/items/4.jpg",
    },
    stok: {
      s: 9,
      m: 9,
      l: 9,
      xl: 9,
    },
    marka: "Polo",
    aciklama:
      "Virgil Abloh’s Off-White is a streetwear-inspired collection that continues to break away from the conventions of mainstream fashion. Made in Italy, these black and brown Odsy-1000 low-top sneakers.",
    ind_fiyat: "29.99",
    normal_fiyat: "39.99",
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
  Yorum.find({ urun_id: req.params.id }, function (err, gelenVeri) {
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
  var yorum = new Yorum({
    urun_id: req.body.urun_id,
    isim: req.body.isim,
    icerik: req.body.icerik,
    tarih: "25 Şubat",
    kullanici_id: req.body.kullanici_id,
    yildiz: req.body.yildiz,
    like: 0,
    dislike: 0,
  });

  /*
  3 yorum 5-4-3
  4 yorum 5-4-3-1
  4 -> 3.25
  */

  yorum.save(function (err) {
    if (!err) {
      //// daha sonra..
    } else {
      res.send({ sonuc: "hata" });
    }
  });
});

app.listen(5000);