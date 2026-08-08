/* ═══════════════════════════════════════════════════════════════
   LabPrep DZ — Application Logic
   All rights reserved to Zekraoui Rabah Allaa Eddine 🦑
   ═══════════════════════════════════════════════════════════════ */

'use strict';
let darkMode = localStorage.getItem('labprepdz_dark') === '1';
let textSizeStep = parseInt(localStorage.getItem('labprepdz_textsize') || '0', 10); // 0-4

let currentLang = 'fr';         // 'fr' | 'ar' | 'en'
let currentCat  = 'all';
let currentQuery = '';
const LANG_CYCLE = ['fr','ar','en'];
let recentlyViewed = [];
try { recentlyViewed = JSON.parse(localStorage.getItem('labprepdz_recent') || '[]'); } catch(e) {}

/* Favorites — persisted in localStorage */
let favorites = [];
try { favorites = JSON.parse(localStorage.getItem('labprepdz_favs') || '[]'); } catch(e) { favorites = []; }

/* Checklist ("my prescribed tests") — session-only by default, but
   persisted too so a half-built list survives an accidental refresh. */
let checklistItems = [];
try { checklistItems = JSON.parse(localStorage.getItem('labprepdz_checklist') || '[]'); } catch(e) { checklistItems = []; }

/* Fasting timer state */
let fastingTimer = { active: false, hours: 0, endTime: null, intervalId: null };
try {
  const saved = JSON.parse(localStorage.getItem('labprepdz_timer') || 'null');
  if (saved && saved.endTime && new Date(saved.endTime).getTime() > Date.now()) {
    fastingTimer = { active: true, hours: saved.hours, endTime: saved.endTime, intervalId: null };
  }
} catch(e) {}

/* ═══════════════════════════════════════════════════════════════
   DATASET — 200+ Medical Analyses (Algeria protocols)
   Each entry:
   id, cat, fasting (hours or 0), tubes[], name_fr, name_ar,
   summary_fr, summary_ar, prep_fr[], prep_ar[], sampling_fr[],
   sampling_ar[], meds_fr[], meds_ar[], note_fr, note_ar
   ═══════════════════════════════════════════════════════════════ */
const DB = [

/* ── BIOCHIMIE ──────────────────────────────────────────────── */
{ id:1, cat:'biochimie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Glycémie à jeun', name_ar:'سكر الدم على الريق',
  summary_fr:"Mesure du taux de glucose sanguin après un jeûne strict de 12 heures.",
  summary_ar:"قياس نسبة الجلوكوز في الدم بعد صيام صارم لمدة 12 ساعة.",
  prep_fr:["Jeûne strict de 12 heures (eau autorisée).","Dernier repas la veille avant 20h.","Éviter tout effort physique intense la veille.","Ne pas fumer avant le prélèvement."],
  prep_ar:["صيام صارم لمدة 12 ساعة (يسمح بشرب الماء).","آخر وجبة في اليوم السابق قبل الساعة 20:00.","تجنب المجهود البدني الشديد في اليوم السابق.","عدم التدخين قبل أخذ العينة."],
  sampling_fr:["Prélèvement veineux le matin entre 7h et 9h.","Un seul tube suffit."],
  sampling_ar:["أخذ عينة وريدية في الصباح بين 7 و9 صباحاً.","أنبوب واحد كافٍ."],
  meds_fr:["Signaler tout traitement antidiabétique (insuline, metformine).","Signaler la corticothérapie."],
  meds_ar:["إبلاغ الفني بأي علاج لمرض السكري (أنسولين، ميتفورمين).","إبلاغ عن العلاج بالكورتيزون."],
  note_fr:"Un jeûne trop long (>16h) peut fausser le résultat vers le bas.",
  note_ar:"الصيام لفترة طويلة جداً (أكثر من 16 ساعة) قد يؤثر سلباً على النتيجة." },

{ id:2, cat:'biochimie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan lipidique complet (EAL)', name_ar:'الفحص الشامل للدهون',
  summary_fr:"Cholestérol total, HDL, LDL et triglycérides — nécessite 12h de jeûne.",
  summary_ar:"الكوليسترول الكلي، HDL، LDL والدهون الثلاثية — يتطلب صيام 12 ساعة.",
  prep_fr:["Jeûne strict de 12 heures.","Pas d'alcool durant les 72h précédentes.","Alimentation habituelle les 3 jours avant (ne pas changer de régime)."],
  prep_ar:["صيام صارم لمدة 12 ساعة.","عدم شرب الكحول خلال 72 ساعة السابقة.","نظام غذائي معتاد خلال 3 أيام قبل الفحص (عدم تغيير النظام الغذائي)."],
  sampling_fr:["Prélèvement veineux le matin.","Position assise 15 minutes avant le prélèvement."],
  sampling_ar:["أخذ عينة وريدية في الصباح.","الجلوس لمدة 15 دقيقة قبل أخذ العينة."],
  meds_fr:["Signaler tout traitement hypolipémiant (statines, fibrates).","Signaler pilule contraceptive ou traitement hormonal."],
  meds_ar:["إبلاغ عن أي علاج لخفض الدهون (ستاتين، فيبرات).","إبلاغ عن حبوب منع الحمل أو العلاج الهرموني."],
  note_fr:"Grossesse et infections récentes peuvent fausser les résultats — à signaler.",
  note_ar:"الحمل والالتهابات الحديثة قد تؤثر على النتائج — يجب الإبلاغ عنها." },

{ id:3, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Urée sanguine', name_ar:'اليوريا في الدم',
  summary_fr:"Évalue la fonction rénale. Ne nécessite pas de jeûne strict.",
  summary_ar:"يقيّم وظيفة الكلى. لا يتطلب صياماً صارماً.",
  prep_fr:["Aucun jeûne obligatoire, mais 4h conseillées.","Bien s'hydrater la veille."],
  prep_ar:["لا يوجد صيام إلزامي، لكن يُنصح بـ4 ساعات.","شرب كمية كافية من الماء في اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler diurétiques et anti-inflammatoires."],
  meds_ar:["إبلاغ عن مدرات البول ومضادات الالتهاب."],
  note_fr:"Souvent couplée à la créatinine dans le même prélèvement.",
  note_ar:"غالباً ما تُجرى مع الكرياتينين في نفس العينة." },

{ id:4, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Créatinine sanguine', name_ar:'الكرياتينين في الدم',
  summary_fr:"Marqueur essentiel de la fonction rénale, sert au calcul du DFG.",
  summary_ar:"مؤشر أساسي لوظيفة الكلى، يُستخدم لحساب معدل الترشيح الكبيبي.",
  prep_fr:["Jeûne non obligatoire.","Éviter un effort musculaire intense 48h avant (fausse la valeur à la hausse)."],
  prep_ar:["الصيام غير إلزامي.","تجنب المجهود العضلي الشديد قبل 48 ساعة (يرفع القيمة بشكل خاطئ)."],
  sampling_fr:["Prélèvement veineux simple, à tout moment de la journée."],
  sampling_ar:["أخذ عينة وريدية بسيطة، في أي وقت من اليوم."],
  meds_fr:["Signaler la prise de créatine (compléments sportifs).","Signaler AINS et certains antibiotiques."],
  meds_ar:["إبلاغ عن تناول الكرياتين (مكملات رياضية).","إبلاغ عن مضادات الالتهاب وبعض المضادات الحيوية."],
  note_fr:"Un régime très riche en viande rouge peut légèrement augmenter le taux.",
  note_ar:"النظام الغذائي الغني جداً باللحوم الحمراء قد يرفع المعدل قليلاً." },

{ id:5, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Transaminases (ASAT/ALAT)', name_ar:'إنزيمات الكبد (ASAT/ALAT)',
  summary_fr:"Enzymes hépatiques, indicateurs de souffrance du foie.",
  summary_ar:"إنزيمات كبدية، مؤشرات على تضرر الكبد.",
  prep_fr:["Jeûne non obligatoire mais recommandé (8h).","Éviter l'alcool 48h avant.","Éviter tout effort physique intense la veille."],
  prep_ar:["الصيام غير إلزامي لكن يُنصح به (8 ساعات).","تجنب الكحول قبل 48 ساعة.","تجنب المجهود البدني الشديد في اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler paracétamol, statines, antibiotiques récents.","Signaler phytothérapie et compléments alimentaires."],
  meds_ar:["إبلاغ عن الباراسيتامول، الستاتين، المضادات الحيوية الحديثة.","إبلاغ عن الأعشاب والمكملات الغذائية."],
  note_fr:"L'injection intramusculaire récente peut augmenter faussement l'ASAT.",
  note_ar:"الحقن العضلي الحديث قد يرفع ASAT بشكل خاطئ." },

{ id:6, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilirubine totale et conjuguée', name_ar:'البيليروبين الكلي والمباشر',
  summary_fr:"Évalue la fonction hépatique et biliaire, dépistage de la jaunisse.",
  summary_ar:"يقيّم وظيفة الكبد والقنوات الصفراوية، الكشف عن اليرقان.",
  prep_fr:["Jeûne de 4h recommandé.","Protéger l'échantillon de la lumière après prélèvement (sensible à la lumière)."],
  prep_ar:["يُنصح بصيام 4 ساعات.","حماية العينة من الضوء بعد أخذها (حساسة للضوء)."],
  sampling_fr:["Prélèvement veineux, tube protégé de la lumière."],
  sampling_ar:["أخذ عينة وريدية، أنبوب محمي من الضوء."],
  meds_fr:["Signaler tout traitement pouvant affecter le foie."],
  meds_ar:["إبلاغ عن أي علاج قد يؤثر على الكبد."],
  note_fr:"Le jeûne prolongé (>24h) peut faussement augmenter la bilirubine indirecte.",
  note_ar:"الصيام لفترة طويلة (أكثر من 24 ساعة) قد يرفع البيليروبين غير المباشر بشكل خاطئ." },

{ id:7, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Phosphatases alcalines (PAL)', name_ar:'الفوسفاتاز القلوي',
  summary_fr:"Enzyme utile pour explorer le foie et les os.",
  summary_ar:"إنزيم مفيد لفحص الكبد والعظام.",
  prep_fr:["Jeûne non obligatoire.","Éviter un repas très gras avant le prélèvement."],
  prep_ar:["الصيام غير إلزامي.","تجنب الوجبات الدسمة قبل أخذ العينة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler contraceptifs oraux et traitements hormonaux."],
  meds_ar:["إبلاغ عن حبوب منع الحمل والعلاجات الهرمونية."],
  note_fr:"Physiologiquement élevée chez l'enfant en croissance et la femme enceinte.",
  note_ar:"ترتفع فيزيولوجياً عند الأطفال في مرحلة النمو والحوامل." },

{ id:8, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Gamma GT (GGT)', name_ar:'غاما GT',
  summary_fr:"Marqueur sensible d'atteinte hépatique et de consommation d'alcool.",
  summary_ar:"مؤشر حساس لتضرر الكبد واستهلاك الكحول.",
  prep_fr:["Jeûne de 8h recommandé.","Arrêter l'alcool au moins 24h avant."],
  prep_ar:["يُنصح بصيام 8 ساعات.","التوقف عن الكحول لمدة 24 ساعة على الأقل قبل الفحص."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler anticonvulsivants, contraceptifs oraux."],
  meds_ar:["إبلاغ عن مضادات الصرع، حبوب منع الحمل."],
  note_fr:"Très sensible même à une consommation modérée d'alcool.",
  note_ar:"حساس جداً حتى للاستهلاك المعتدل للكحول." },

{ id:9, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Protéine C-Réactive (CRP)', name_ar:'البروتين المتفاعل C',
  summary_fr:"Marqueur d'inflammation aiguë ou d'infection.",
  summary_ar:"مؤشر على الالتهاب الحاد أو العدوى.",
  prep_fr:["Aucune préparation particulière.","Aucun jeûne nécessaire."],
  prep_ar:["لا يوجد تحضير خاص.","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple, à tout moment."],
  sampling_ar:["أخذ عينة وريدية بسيطة، في أي وقت."],
  meds_fr:["Signaler anti-inflammatoires et corticoïdes en cours."],
  meds_ar:["إبلاغ عن مضادات الالتهاب والكورتيزون الجاري تناوله."],
  note_fr:"S'élève rapidement (6-12h) après le début d'une infection.",
  note_ar:"يرتفع بسرعة (6-12 ساعة) بعد بداية العدوى." },

{ id:10, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Ionogramme sanguin (Na, K, Cl)', name_ar:'الأيونات في الدم',
  summary_fr:"Mesure des électrolytes sanguins essentiels à l'équilibre du corps.",
  summary_ar:"قياس الشوارد الأساسية لتوازن الجسم.",
  prep_fr:["Aucun jeûne obligatoire.","Ne pas serrer le poing de façon prolongée pendant le prélèvement (fausse le potassium)."],
  prep_ar:["لا يوجد صيام إلزامي.","عدم قبض القبضة لفترة طويلة أثناء أخذ العينة (يؤثر على البوتاسيوم)."],
  sampling_fr:["Prélèvement veineux rapide, sans garrot prolongé."],
  sampling_ar:["أخذ عينة وريدية سريعة، دون رباط ضاغط لفترة طويلة."],
  meds_fr:["Signaler diurétiques, IEC, laxatifs."],
  meds_ar:["إبلاغ عن مدرات البول، مثبطات الإنزيم المحول، الملينات."],
  note_fr:"L'échantillon doit être analysé rapidement pour éviter l'hémolyse.",
  note_ar:"يجب تحليل العينة بسرعة لتجنب انحلال الدم." },

{ id:11, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Calcémie (Calcium sanguin)', name_ar:'الكالسيوم في الدم',
  summary_fr:"Taux de calcium sanguin, important pour os, muscles et nerfs.",
  summary_ar:"مستوى الكالسيوم في الدم، مهم للعظام والعضلات والأعصاب.",
  prep_fr:["Jeûne de 4h conseillé.","Éviter garrot prolongé lors du prélèvement."],
  prep_ar:["يُنصح بصيام 4 ساعات.","تجنب الرباط الضاغط لفترة طويلة أثناء أخذ العينة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler suppléments calciques et vitamine D.","Signaler diurétiques thiazidiques."],
  meds_ar:["إبلاغ عن مكملات الكالسيوم وفيتامين د.","إبلاغ عن مدرات البول الثيازيدية."],
  note_fr:"Souvent interprétée avec l'albuminémie (calcium corrigé).",
  note_ar:"غالباً ما تُفسَّر مع الألبومين (الكالسيوم المصحح)." },

{ id:12, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Magnésémie (Magnésium)', name_ar:'المغنيزيوم في الدم',
  summary_fr:"Mesure du magnésium sanguin, essentiel pour muscles et cœur.",
  summary_ar:"قياس المغنيزيوم في الدم، ضروري للعضلات والقلب.",
  prep_fr:["Jeûne non obligatoire.","Éviter la prise de compléments en magnésium le jour même."],
  prep_ar:["الصيام غير إلزامي.","تجنب تناول مكملات المغنيزيوم في نفس اليوم."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler diurétiques et laxatifs."],
  meds_ar:["إبلاغ عن مدرات البول والملينات."],
  note_fr:"L'hémolyse de l'échantillon peut fausser les résultats.",
  note_ar:"انحلال الدم في العينة قد يؤثر على النتائج." },

{ id:13, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Phosphorémie (Phosphore)', name_ar:'الفوسفور في الدم',
  summary_fr:"Taux de phosphore, lié au métabolisme osseux et rénal.",
  summary_ar:"مستوى الفوسفور، مرتبط بأيض العظام والكلى.",
  prep_fr:["Jeûne de 8h recommandé (le phosphore varie avec les repas)."],
  prep_ar:["يُنصح بصيام 8 ساعات (يتغير الفوسفور حسب الوجبات)."],
  sampling_fr:["Prélèvement veineux le matin de préférence."],
  sampling_ar:["يفضل أخذ العينة الوريدية في الصباح."],
  meds_fr:["Signaler antiacides à base d'aluminium.","Signaler compléments en vitamine D."],
  meds_ar:["إبلاغ عن مضادات الحموضة المحتوية على الألمنيوم.","إبلاغ عن مكملات فيتامين د."],
  note_fr:"Varie selon le rythme circadien — le matin est recommandé.",
  note_ar:"يتغير حسب الساعة البيولوجية — يُفضل الصباح." },

{ id:14, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Acide urique (Uricémie)', name_ar:'حمض اليوريك في الدم',
  summary_fr:"Dépistage de la goutte et évaluation du métabolisme des purines.",
  summary_ar:"الكشف عن النقرس وتقييم أيض البيورينات.",
  prep_fr:["Jeûne de 8h recommandé.","Éviter alcool et abats (foie, rognons) 48h avant.","Éviter fruits de mer la veille."],
  prep_ar:["يُنصح بصيام 8 ساعات.","تجنب الكحول والأحشاء (الكبد، الكلى) قبل 48 ساعة.","تجنب المأكولات البحرية في اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler aspirine à faible dose et diurétiques.","Signaler traitement anti-goutte (allopurinol)."],
  meds_ar:["إبلاغ عن الأسبرين بجرعة منخفضة ومدرات البول.","إبلاغ عن علاج النقرس (ألوبورينول)."],
  note_fr:"Le jeûne excessif ou un régime riche en purines fausse fortement le résultat.",
  note_ar:"الصيام المفرط أو النظام الغني بالبيورينات يؤثر بشدة على النتيجة." },

{ id:15, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Protéines totales (Protidémie)', name_ar:'البروتينات الكلية',
  summary_fr:"Mesure globale des protéines sanguines (albumine + globulines).",
  summary_ar:"قياس شامل لبروتينات الدم (الألبومين + الغلوبيولين).",
  prep_fr:["Jeûne de 8h conseillé.","Rester assis 15 min avant le prélèvement."],
  prep_ar:["يُنصح بصيام 8 ساعات.","الجلوس لمدة 15 دقيقة قبل أخذ العينة."],
  sampling_fr:["Prélèvement veineux, sans garrot prolongé."],
  sampling_ar:["أخذ عينة وريدية، دون رباط ضاغط لفترة طويلة."],
  meds_fr:["Signaler corticoïdes et œstrogènes."],
  meds_ar:["إبلاغ عن الكورتيزون والإستروجين."],
  note_fr:"La position debout prolongée avant le test augmente artificiellement le taux.",
  note_ar:"الوقوف لفترة طويلة قبل الفحص يرفع المعدل بشكل مصطنع." },

{ id:16, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Albuminémie', name_ar:'الألبومين في الدم',
  summary_fr:"Évalue l'état nutritionnel et la fonction hépatique/rénale.",
  summary_ar:"يقيّم الحالة الغذائية ووظيفة الكبد/الكلى.",
  prep_fr:["Jeûne non strictement obligatoire.","Éviter déshydratation avant le test."],
  prep_ar:["الصيام غير إلزامي بشكل صارم.","تجنب الجفاف قبل الفحص."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler perfusions récentes d'albumine ou de sérum."],
  meds_ar:["إبلاغ عن التسريب الحديث للألبومين أو المصل."],
  note_fr:"Peut être faussement basse en cas de grossesse ou d'hyperhydratation.",
  note_ar:"قد تكون منخفضة بشكل خاطئ في حالة الحمل أو فرط الترطيب." },

{ id:17, cat:'biochimie', fasting:12, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Hémoglobine glyquée (HbA1c)', name_ar:'الهيموغلوبين السكري HbA1c',
  summary_fr:"Reflet de l'équilibre glycémique des 3 derniers mois.",
  summary_ar:"يعكس توازن السكر في الدم خلال آخر 3 أشهر.",
  prep_fr:["Aucun jeûne n'est réellement nécessaire (mais souvent demandé avec glycémie).","Aucune restriction alimentaire particulière."],
  prep_ar:["لا حاجة فعلية للصيام (لكن غالباً ما يُطلب مع فحص السكر).","لا قيود غذائية خاصة."],
  sampling_fr:["Prélèvement veineux simple, à tout moment de la journée."],
  sampling_ar:["أخذ عينة وريدية بسيطة، في أي وقت من اليوم."],
  meds_fr:["Signaler transfusions sanguines récentes (fausse le résultat)."],
  meds_ar:["إبلاغ عن عمليات نقل الدم الحديثة (تؤثر على النتيجة)."],
  note_fr:"Faussée en cas d'anémie, hémoglobinopathies ou transfusion récente.",
  note_ar:"تتأثر في حالة فقر الدم أو اعتلال الهيموغلوبين أو نقل الدم الحديث." },

{ id:18, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Amylasémie', name_ar:'الأميلاز في الدم',
  summary_fr:"Enzyme pancréatique, utile en cas de suspicion de pancréatite.",
  summary_ar:"إنزيم البنكرياس، مفيد عند الاشتباه بالتهاب البنكرياس.",
  prep_fr:["Jeûne de 4h recommandé.","Éviter alcool 24h avant."],
  prep_ar:["يُنصح بصيام 4 ساعات.","تجنب الكحول قبل 24 ساعة."],
  sampling_fr:["Prélèvement veineux simple, idéalement pendant la crise douloureuse."],
  sampling_ar:["أخذ عينة وريدية، يفضل أثناء نوبة الألم."],
  meds_fr:["Signaler morphiniques (peuvent augmenter le taux)."],
  meds_ar:["إبلاغ عن مسكنات الألم الأفيونية (قد ترفع المعدل)."],
  note_fr:"S'élève dans les 2-12h après le début d'une pancréatite aiguë.",
  note_ar:"يرتفع خلال 2-12 ساعة بعد بداية التهاب البنكرياس الحاد." },

{ id:19, cat:'biochimie', fasting:4, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Lipasémie', name_ar:'الليباز في الدم',
  summary_fr:"Enzyme spécifique du pancréas, plus fiable que l'amylase.",
  summary_ar:"إنزيم خاص بالبنكرياس، أكثر موثوقية من الأميلاز.",
  prep_fr:["Jeûne de 4h recommandé.","Éviter repas gras la veille au soir."],
  prep_ar:["يُنصح بصيام 4 ساعات.","تجنب الوجبات الدسمة في مساء اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement par morphine ou codéine."],
  meds_ar:["إبلاغ عن العلاج بالمورفين أو الكودايين."],
  note_fr:"Reste élevée plus longtemps que l'amylase (jusqu'à 14 jours).",
  note_ar:"تبقى مرتفعة لفترة أطول من الأميلاز (حتى 14 يوماً)." },

{ id:20, cat:'biochimie', fasting:12, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'},{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Hyperglycémie provoquée par voie orale (HGPO)', name_ar:'اختبار تحمل الجلوكوز الفموي',
  summary_fr:"Dépiste le diabète gestationnel et le pré-diabète.",
  summary_ar:"يكشف سكري الحمل وما قبل السكري.",
  prep_fr:["Jeûne strict de 12 heures avant le test.","Alimentation normale (riche en glucides) les 3 jours précédents.","Ne pas fumer pendant le test."],
  prep_ar:["صيام صارم لمدة 12 ساعة قبل الفحص.","نظام غذائي طبيعي (غني بالكربوهيدرات) خلال 3 أيام قبل الفحص.","عدم التدخين أثناء الفحص."],
  sampling_fr:["Prélèvement à jeun, puis ingestion de 75g de glucose, puis prélèvements à H1 et H2.","Rester assis et calme pendant tout le test (2h)."],
  sampling_ar:["أخذ عينة على الريق، ثم شرب 75غ من الجلوكوز، ثم أخذ عينات بعد ساعة وساعتين.","البقاء جالساً وهادئاً طوال الفحص (ساعتان)."],
  meds_fr:["Signaler tout traitement pouvant modifier la glycémie (corticoïdes, bêta-bloquants)."],
  meds_ar:["إبلاغ عن أي علاج قد يغير نسبة السكر (كورتيزون، حاصرات بيتا)."],
  note_fr:"Test long (2-3h) — prévoir du temps, rester au laboratoire entre les prélèvements.",
  note_ar:"فحص طويل (2-3 ساعات) — يجب توفير الوقت والبقاء في المخبر بين أخذ العينات." },

{ id:21, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Fer sérique', name_ar:'الحديد في الدم',
  summary_fr:"Évalue les réserves en fer, utile pour le dépistage d'anémie.",
  summary_ar:"يقيّم مخزون الحديد، مفيد للكشف عن فقر الدم.",
  prep_fr:["Jeûne de 12h recommandé (le fer varie selon les repas).","Prélèvement de préférence le matin (8h-10h) — pic circadien.","Ne pas prendre de complément en fer 24h avant."],
  prep_ar:["يُنصح بصيام 12 ساعة (يتغير الحديد حسب الوجبات).","يفضل أخذ العينة صباحاً (8-10) — ذروة الساعة البيولوجية.","عدم تناول مكملات الحديد قبل 24 ساعة."],
  sampling_fr:["Prélèvement veineux le matin."],
  sampling_ar:["أخذ عينة وريدية في الصباح."],
  meds_fr:["Signaler tout traitement à base de fer.","Signaler transfusions récentes."],
  meds_ar:["إبلاغ عن أي علاج يحتوي على الحديد.","إبلاغ عن عمليات نقل الدم الحديثة."],
  note_fr:"Varie fortement dans la journée — toujours prélever le matin pour comparer.",
  note_ar:"يتغير بشدة خلال اليوم — يجب أخذ العينة دائماً في الصباح للمقارنة." },

{ id:22, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Ferritine', name_ar:'الفيريتين',
  summary_fr:"Meilleur marqueur des réserves en fer de l'organisme.",
  summary_ar:"أفضل مؤشر على مخزون الحديد في الجسم.",
  prep_fr:["Jeûne non strictement obligatoire.","Éviter effort physique intense la veille."],
  prep_ar:["الصيام غير إلزامي بشكل صارم.","تجنب المجهود البدني الشديد في اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler tout traitement martial en cours."],
  meds_ar:["إبلاغ عن أي علاج بالحديد جارٍ."],
  note_fr:"S'élève faussement en cas d'inflammation ou d'infection — coupler avec la CRP.",
  note_ar:"يرتفع بشكل خاطئ في حالة الالتهاب أو العدوى — يُنصح بربطه مع CRP." },

{ id:23, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Transferrine (Sidérophiline)', name_ar:'الترانسفيرين',
  summary_fr:"Protéine de transport du fer, complète le bilan martial.",
  summary_ar:"بروتين نقل الحديد، يكمل تقييم الحديد.",
  prep_fr:["Jeûne de 8h recommandé.","Prélèvement de préférence le matin."],
  prep_ar:["يُنصح بصيام 8 ساعات.","يفضل أخذ العينة صباحاً."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler contraceptifs oraux et grossesse."],
  meds_ar:["إبلاغ عن حبوب منع الحمل والحمل."],
  note_fr:"Diminue en cas d'inflammation, augmente en cas de carence en fer.",
  note_ar:"ينخفض في حالة الالتهاب، ويرتفع في حالة نقص الحديد." },

{ id:24, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'CPK (Créatine Phosphokinase)', name_ar:'إنزيم CPK',
  summary_fr:"Marqueur de souffrance musculaire (cœur ou muscles squelettiques).",
  summary_ar:"مؤشر على تضرر العضلات (القلب أو العضلات الهيكلية).",
  prep_fr:["Jeûne non obligatoire.","Éviter tout effort physique intense ou injection IM 48h avant."],
  prep_ar:["الصيام غير إلزامي.","تجنب أي مجهود بدني شديد أو حقنة عضلية قبل 48 ساعة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler statines et injections intramusculaires récentes."],
  meds_ar:["إبلاغ عن الستاتين والحقن العضلي الحديث."],
  note_fr:"Très sensible à l'effort musculaire — même une marche rapide peut fausser le résultat.",
  note_ar:"حساس جداً للمجهود العضلي — حتى المشي السريع قد يؤثر على النتيجة." },

{ id:25, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Troponine (Ic ou T)', name_ar:'التروبونين',
  summary_fr:"Marqueur spécifique de l'infarctus du myocarde — urgence cardiaque.",
  summary_ar:"مؤشر خاص باحتشاء عضلة القلب — حالة قلبية طارئة.",
  prep_fr:["Aucune préparation — test d'urgence réalisé immédiatement.","Pas de jeûne requis."],
  prep_ar:["لا تحضير — فحص طارئ يُجرى فوراً.","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux immédiat, souvent répété à H0, H3, H6 pour suivre la cinétique."],
  sampling_ar:["أخذ عينة وريدية فورية، غالباً تُكرر عند الساعة صفر، 3، 6 لمتابعة التطور."],
  meds_fr:["Signaler tout traitement anticoagulant en cours."],
  meds_ar:["إبلاغ عن أي علاج مضاد للتخثر جارٍ."],
  note_fr:"Test réalisé en urgence, aucune préparation spéciale n'est nécessaire.",
  note_ar:"يُجرى الفحص في حالة طارئة، لا حاجة لتحضير خاص." },

{ id:26, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'LDH (Lactate Déshydrogénase)', name_ar:'إنزيم LDH',
  summary_fr:"Marqueur non spécifique de destruction cellulaire (cœur, foie, muscles, sang).",
  summary_ar:"مؤشر غير خاص على تدمير الخلايا (القلب، الكبد، العضلات، الدم).",
  prep_fr:["Jeûne de 4h conseillé.","Éviter l'hémolyse — technique de prélèvement soigneuse requise."],
  prep_ar:["يُنصح بصيام 4 ساعات.","تجنب انحلال الدم — يتطلب تقنية أخذ عينة دقيقة."],
  sampling_fr:["Prélèvement veineux simple, éviter le garrot prolongé."],
  sampling_ar:["أخذ عينة وريدية بسيطة، تجنب الرباط الضاغط لفترة طويلة."],
  meds_fr:["Signaler traitement anticancéreux récent."],
  meds_ar:["إبلاغ عن العلاج الكيميائي الحديث."],
  note_fr:"Facilement faussée par une hémolyse de l'échantillon.",
  note_ar:"تتأثر بسهولة بانحلال الدم في العينة." },

{ id:27, cat:'biochimie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Gaz du sang artériel', name_ar:'غازات الدم الشرياني',
  summary_fr:"Mesure l'oxygénation et l'équilibre acido-basique du sang.",
  summary_ar:"يقيس الأكسجة والتوازن الحمضي القاعدي للدم.",
  prep_fr:["Aucun jeûne nécessaire.","Rester au repos 20-30 min avant le prélèvement.","Signaler oxygénothérapie en cours (débit exact)."],
  prep_ar:["لا حاجة للصيام.","الراحة لمدة 20-30 دقيقة قبل أخذ العينة.","إبلاغ عن العلاج بالأكسجين الجاري (المعدل الدقيق)."],
  sampling_fr:["Prélèvement artériel (poignet ou aine) par un médecin ou technicien qualifié.","Compression du point de ponction 5 minutes après."],
  sampling_ar:["أخذ عينة شريانية (المعصم أو الفخذ) من قبل طبيب أو فني مؤهل.","الضغط على مكان الوخز لمدة 5 دقائق بعد ذلك."],
  meds_fr:["Signaler oxygénothérapie et ventilation assistée."],
  meds_ar:["إبلاغ عن العلاج بالأكسجين والتنفس الاصطناعي."],
  note_fr:"Prélèvement plus douloureux que veineux — analyse immédiate obligatoire (échantillon instable).",
  note_ar:"أخذ العينة أكثر ألماً من الوريدي — التحليل الفوري إلزامي (العينة غير مستقرة)." },

{ id:28, cat:'biochimie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Lactate sanguin', name_ar:'اللاكتات في الدم',
  summary_fr:"Marqueur d'hypoxie tissulaire et d'effort musculaire intense.",
  summary_ar:"مؤشر على نقص الأكسجة في الأنسجة والمجهود العضلي الشديد.",
  prep_fr:["Rester au repos avant le prélèvement.","Éviter de serrer le poing pendant le prélèvement (fausse le résultat)."],
  prep_ar:["الراحة قبل أخذ العينة.","تجنب قبض القبضة أثناء أخذ العينة (يؤثر على النتيجة)."],
  sampling_fr:["Prélèvement veineux sans garrot, ou artériel selon contexte clinique."],
  sampling_ar:["أخذ عينة وريدية دون رباط ضاغط، أو شريانية حسب الحالة السريرية."],
  meds_fr:["Signaler metformine (peut augmenter le lactate)."],
  meds_ar:["إبلاغ عن الميتفورمين (قد يرفع اللاكتات)."],
  note_fr:"Doit être analysé dans les 15 minutes suivant le prélèvement.",
  note_ar:"يجب تحليله خلال 15 دقيقة من أخذ العينة." },

{ id:29, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Cholestérol total', name_ar:'الكوليسترول الكلي',
  summary_fr:"Peut être demandé seul, hors bilan lipidique complet.",
  summary_ar:"قد يُطلب منفرداً، خارج الفحص الشامل للدهون.",
  prep_fr:["Jeûne de 12h recommandé si demandé isolément pour comparaison au bilan lipidique."],
  prep_ar:["يُنصح بصيام 12 ساعة إذا طُلب منفرداً للمقارنة مع الفحص الشامل."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement hypolipémiant."],
  meds_ar:["إبلاغ عن علاج خفض الدهون."],
  note_fr:"Varie peu dans la journée contrairement aux triglycérides.",
  note_ar:"يتغير قليلاً خلال اليوم على عكس الدهون الثلاثية." },

{ id:30, cat:'biochimie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Triglycérides', name_ar:'الدهون الثلاثية',
  summary_fr:"Très sensible à l'alimentation récente — nécessite un jeûne strict.",
  summary_ar:"حساس جداً للتغذية الأخيرة — يتطلب صياماً صارماً.",
  prep_fr:["Jeûne strict de 12 heures.","Pas d'alcool 72h avant.","Éviter repas très gras la veille."],
  prep_ar:["صيام صارم لمدة 12 ساعة.","عدم شرب الكحول قبل 72 ساعة.","تجنب الوجبات الدسمة جداً في اليوم السابق."],
  sampling_fr:["Prélèvement veineux le matin."],
  sampling_ar:["أخذ عينة وريدية في الصباح."],
  meds_fr:["Signaler bêta-bloquants, corticoïdes, œstrogènes."],
  meds_ar:["إبلاغ عن حاصرات بيتا، الكورتيزون، الإستروجين."],
  note_fr:"Le marqueur le plus sensible au non-respect du jeûne dans tout le bilan sanguin.",
  note_ar:"المؤشر الأكثر حساسية لعدم احترام الصيام في كامل الفحص الدموي." },


/* ── HÉMATOLOGIE ────────────────────────────────────────────── */
{ id:31, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'NFS (Numération Formule Sanguine)', name_ar:'تعداد الدم الكامل NFS',
  summary_fr:"Analyse globale des globules rouges, blancs et plaquettes.",
  summary_ar:"تحليل شامل لكريات الدم الحمراء والبيضاء والصفائح الدموية.",
  prep_fr:["Aucun jeûne obligatoire.","Éviter effort physique intense avant le prélèvement.","Signaler si fièvre ou infection en cours."],
  prep_ar:["لا يوجد صيام إلزامي.","تجنب المجهود البدني الشديد قبل أخذ العينة.","إبلاغ الفني في حال وجود حمى أو عدوى."],
  sampling_fr:["Prélèvement veineux simple, à tout moment de la journée."],
  sampling_ar:["أخذ عينة وريدية بسيطة، في أي وقت من اليوم."],
  meds_fr:["Signaler tout traitement anticoagulant ou chimiothérapie."],
  meds_ar:["إبلاغ عن أي علاج مضاد للتخثر أو علاج كيميائي."],
  note_fr:"Résultat disponible généralement en quelques heures, souvent le jour même.",
  note_ar:"النتيجة متوفرة عادة خلال ساعات قليلة، غالباً في نفس اليوم." },

{ id:32, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Vitesse de sédimentation (VS)', name_ar:'سرعة الترسيب VS',
  summary_fr:"Marqueur non spécifique d'inflammation ou d'infection.",
  summary_ar:"مؤشر غير خاص على الالتهاب أو العدوى.",
  prep_fr:["Aucun jeûne nécessaire.","Éviter la grossesse récente comme facteur (à signaler si présente)."],
  prep_ar:["لا حاجة للصيام.","الحمل الحديث قد يؤثر (يجب الإبلاغ عنه)."],
  sampling_fr:["Prélèvement veineux simple, analyse dans les 2h suivant le prélèvement."],
  sampling_ar:["أخذ عينة وريدية بسيطة، يُحلل خلال ساعتين من أخذها."],
  meds_fr:["Signaler anti-inflammatoires en cours."],
  meds_ar:["إبلاغ عن مضادات الالتهاب الجارية."],
  note_fr:"Physiologiquement augmentée pendant la grossesse et chez la femme âgée.",
  note_ar:"ترتفع فيزيولوجياً أثناء الحمل وعند النساء المسنات." },

{ id:33, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Groupage sanguin ABO/Rhésus', name_ar:'فصيلة الدم ABO/Rh',
  summary_fr:"Détermine le groupe sanguin, nécessaire avant transfusion ou chirurgie.",
  summary_ar:"يحدد فصيلة الدم، ضروري قبل نقل الدم أو الجراحة.",
  prep_fr:["Aucune préparation nécessaire.","Aucun jeûne requis."],
  prep_ar:["لا حاجة لتحضير.","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux, généralement 2 déterminations sur 2 prélèvements séparés."],
  sampling_ar:["أخذ عينة وريدية، عادة تحديدان على عينتين منفصلتين."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Résultat définitif obtenu après 2 déterminations concordantes (carte de groupe sanguin délivrée).",
  note_ar:"النتيجة النهائية تُحصل بعد تحديدين متطابقين (تُسلّم بطاقة فصيلة الدم)." },

{ id:34, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Réticulocytes', name_ar:'الخلايا الشبكية',
  summary_fr:"Évalue la capacité de régénération de la moelle osseuse.",
  summary_ar:"يقيّم قدرة النخاع العظمي على التجدد.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler toute transfusion récente."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن أي نقل دم حديث."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement par fer, vitamine B12 ou acide folique récent."],
  meds_ar:["إبلاغ عن العلاج بالحديد أو فيتامين B12 أو حمض الفوليك الحديث."],
  note_fr:"Utile pour différencier une anémie centrale d'une anémie périphérique.",
  note_ar:"مفيد للتمييز بين فقر الدم المركزي والمحيطي." },

{ id:35, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Frottis sanguin', name_ar:'مسحة الدم',
  summary_fr:"Examen microscopique de la morphologie des cellules sanguines.",
  summary_ar:"فحص مجهري لشكل خلايا الدم.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux ou capillaire (piqûre au doigt)."],
  sampling_ar:["أخذ عينة وريدية أو شعرية (وخز الإصبع)."],
  meds_fr:["Signaler chimiothérapie ou traitement récent affectant le sang."],
  meds_ar:["إبلاغ عن العلاج الكيميائي أو أي علاج حديث يؤثر على الدم."],
  note_fr:"Doit être réalisé rapidement après le prélèvement pour éviter les artefacts.",
  note_ar:"يجب إجراؤه بسرعة بعد أخذ العينة لتجنب التشوهات." },

{ id:36, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'TP / INR (Taux de Prothrombine)', name_ar:'زمن البروثرومبين TP/INR',
  summary_fr:"Évalue la coagulation, essentiel pour le suivi des anticoagulants (AVK).",
  summary_ar:"يقيّم التخثر، ضروري لمتابعة مضادات التخثر.",
  prep_fr:["Aucun jeûne nécessaire.","Prélèvement à heure fixe si sous traitement AVK (suivi régulier)."],
  prep_ar:["لا حاجة للصيام.","أخذ العينة في وقت ثابت إذا كان المريض تحت علاج مضاد للتخثر."],
  sampling_fr:["Prélèvement veineux, tube à remplir précisément jusqu'au trait (rapport sang/citrate strict)."],
  sampling_ar:["أخذ عينة وريدية، يجب ملء الأنبوب بدقة حتى العلامة (نسبة دقيقة بين الدم والسيترات)."],
  meds_fr:["Signaler impérativement tout traitement anticoagulant (Sintrom, Previscan, Warfarine).","Signaler antibiotiques récents."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج مضاد للتخثر (سنترون، بريفيسكان، وارفارين).","إبلاغ عن المضادات الحيوية الحديثة."],
  note_fr:"Le tube mal rempli invalide totalement le résultat — vérification systématique par le technicien.",
  note_ar:"الأنبوب غير المملوء بشكل صحيح يبطل النتيجة تماماً — يتحقق الفني من ذلك دائماً." },

{ id:37, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'TCA (Temps de Céphaline Activée)', name_ar:'زمن الثرومبوبلاستين الجزئي TCA',
  summary_fr:"Explore la voie intrinsèque de la coagulation.",
  summary_ar:"يفحص المسار الداخلي للتخثر.",
  prep_fr:["Aucun jeûne nécessaire.","Éviter tout traumatisme au point de ponction avant le test."],
  prep_ar:["لا حاجة للصيام.","تجنب أي إصابة في مكان الوخز قبل الفحص."],
  sampling_fr:["Prélèvement veineux, tube citraté rempli précisément."],
  sampling_ar:["أخذ عينة وريدية، أنبوب سيترات مملوء بدقة."],
  meds_fr:["Signaler héparine et anticoagulants en cours."],
  meds_ar:["إبلاغ عن الهيبارين ومضادات التخثر الجارية."],
  note_fr:"Utilisé pour surveiller les traitements par héparine.",
  note_ar:"يُستخدم لمراقبة العلاج بالهيبارين." },

{ id:38, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'Fibrinogène', name_ar:'الفيبرينوجين',
  summary_fr:"Protéine de coagulation, marqueur inflammatoire.",
  summary_ar:"بروتين التخثر، مؤشر التهابي.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux, tube citraté."],
  sampling_ar:["أخذ عينة وريدية، أنبوب سيترات."],
  meds_fr:["Signaler traitement anticoagulant en cours."],
  meds_ar:["إبلاغ عن العلاج المضاد للتخثر الجاري."],
  note_fr:"Augmente en cas d'inflammation, de grossesse ou d'infection.",
  note_ar:"يرتفع في حالة الالتهاب أو الحمل أو العدوى." },

{ id:39, cat:'coagulation', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'D-Dimères', name_ar:'D-ديمير',
  summary_fr:"Dépistage de thrombose veineuse profonde ou embolie pulmonaire.",
  summary_ar:"الكشف عن الجلطة الوريدية العميقة أو الانصمام الرئوي.",
  prep_fr:["Aucun jeûne nécessaire, test souvent réalisé en urgence."],
  prep_ar:["لا حاجة للصيام، غالباً ما يُجرى في حالة طارئة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler grossesse et anticoagulants."],
  meds_ar:["إبلاغ عن الحمل ومضادات التخثر."],
  note_fr:"Faussement élevé en cas de grossesse, chirurgie récente ou cancer.",
  note_ar:"يرتفع بشكل خاطئ في حالة الحمل أو الجراحة الحديثة أو السرطان." },

{ id:40, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Électrophorèse de l\'hémoglobine', name_ar:'الرحلان الكهربائي للهيموغلوبين',
  summary_fr:"Dépistage des hémoglobinopathies (drépanocytose, thalassémie).",
  summary_ar:"الكشف عن اعتلالات الهيموغلوبين (فقر الدم المنجلي، الثلاسيميا).",
  prep_fr:["Aucun jeûne nécessaire.","Signaler transfusion sanguine dans les 3 derniers mois."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن نقل الدم خلال آخر 3 أشهر."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Une transfusion récente peut fausser complètement les résultats.",
  note_ar:"نقل الدم الحديث قد يشوه النتائج بالكامل." },

/* ── BACTÉRIOLOGIE ──────────────────────────────────────────── */
{ id:41, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'ECBU (Examen Cytobactériologique des Urines)', name_ar:'التحليل الجرثومي للبول ECBU',
  summary_fr:"Recherche d'infection urinaire — nécessite une toilette intime rigoureuse.",
  summary_ar:"البحث عن التهاب المسالك البولية — يتطلب نظافة حميمة دقيقة.",
  prep_fr:["Toilette intime avec savon avant le prélèvement.","Recueillir les urines du milieu du jet (deuxième partie de la miction).","Idéalement la première miction du matin.","Ne pas être sous antibiotique depuis au moins 7 jours."],
  prep_ar:["نظافة حميمة بالصابون قبل أخذ العينة.","جمع البول من منتصف التبول (الجزء الثاني من التبول).","يفضل أول تبول في الصباح.","عدم تناول مضادات حيوية منذ 7 أيام على الأقل."],
  sampling_fr:["Recueillir 20-30 mL dans le pot stérile fourni par le laboratoire.","Refermer immédiatement et apporter au labo dans l'heure qui suit."],
  sampling_ar:["جمع 20-30 مل في الوعاء المعقم المقدم من المخبر.","إغلاقه فوراً وإحضاره للمخبر خلال ساعة."],
  meds_fr:["IMPORTANT : signaler toute prise récente d'antibiotique — fausse totalement la culture."],
  meds_ar:["مهم جداً: إبلاغ عن أي تناول حديث لمضاد حيوي — يشوه الزرع بالكامل."],
  note_fr:"L'antibiothérapie récente est la cause n°1 de faux négatifs en Algérie — à éviter absolument avant le test.",
  note_ar:"العلاج الحديث بالمضادات الحيوية هو السبب الأول للنتائج السلبية الخاطئة في الجزائر — يجب تجنبه تماماً قبل الفحص." },

{ id:42, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement de gorge (angine)', name_ar:'مسحة الحلق',
  summary_fr:"Recherche de streptocoque bêta-hémolytique du groupe A.",
  summary_ar:"البحث عن المكورات العقدية الحالة للدم من الزمرة A.",
  prep_fr:["Ne pas se brosser les dents ni utiliser de bain de bouche avant le test.","Ne pas manger ni boire 2h avant le prélèvement.","Ne pas être sous antibiotique."],
  prep_ar:["عدم تنظيف الأسنان أو استخدام غسول الفم قبل الفحص.","عدم الأكل أو الشرب لمدة ساعتين قبل أخذ العينة.","عدم تناول مضادات حيوية."],
  sampling_fr:["Écouvillonnage des amygdales et du pharynx par le technicien."],
  sampling_ar:["مسح اللوزتين والبلعوم من قبل الفني."],
  meds_fr:["Signaler impérativement toute prise récente d'antibiotique."],
  meds_ar:["إبلاغ إلزامياً عن أي تناول حديث لمضاد حيوي."],
  note_fr:"Le réflexe nauséeux est normal — respirer par la bouche facilite le geste.",
  note_ar:"منعكس الغثيان طبيعي — التنفس عبر الفم يسهل العملية." },

{ id:43, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Flacons hémoculture',n_ar:'قوارير زرع الدم'}],
  name_fr:'Hémoculture', name_ar:'زرع الدم',
  summary_fr:"Recherche de bactéries dans le sang — réalisée idéalement lors d'un pic fébrile.",
  summary_ar:"البحث عن الجراثيم في الدم — يفضل إجراؤه أثناء ذروة الحمى.",
  prep_fr:["Désinfection cutanée rigoureuse par le personnel avant le prélèvement.","Idéalement prélevé lors d'un pic de fièvre ou de frissons.","Ne pas être sous antibiotique si possible."],
  prep_ar:["تعقيم دقيق للجلد من قبل الطاقم الطبي قبل أخذ العينة.","يفضل أخذها أثناء ذروة الحمى أو القشعريرة.","عدم تناول مضادات حيوية إن أمكن."],
  sampling_fr:["Prélèvement de 2-3 paires de flacons (aérobie/anaérobie) à des sites différents.","Répéter si nécessaire à intervalle de 30 minutes."],
  sampling_ar:["أخذ 2-3 أزواج من القوارير (هوائي/لاهوائي) من مواقع مختلفة.","التكرار عند الحاجة بفاصل 30 دقيقة."],
  meds_fr:["Signaler impérativement toute antibiothérapie en cours ou récente."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج بالمضادات الحيوية جارٍ أو حديث."],
  note_fr:"Résultat définitif en 3-5 jours (culture + antibiogramme) — une réponse préliminaire peut être donnée à 24h.",
  note_ar:"النتيجة النهائية خلال 3-5 أيام (زرع + اختبار حساسية) — يمكن إعطاء نتيجة أولية بعد 24 ساعة." },

{ id:44, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement vaginal (PV)', name_ar:'المسحة المهبلية',
  summary_fr:"Recherche d'infections vaginales (mycoses, vaginose, IST).",
  summary_ar:"البحث عن التهابات مهبلية (فطريات، التهاب المهبل، أمراض منقولة جنسياً).",
  prep_fr:["Éviter les rapports sexuels 48h avant.","Ne pas faire de toilette vaginale interne (pas de douche vaginale) 48h avant.","Éviter les ovules ou traitements locaux 7 jours avant.","Ne pas être pendant les règles."],
  prep_ar:["تجنب العلاقات الجنسية قبل 48 ساعة.","عدم القيام بغسول مهبلي داخلي قبل 48 ساعة.","تجنب اللبوس المهبلي أو العلاجات الموضعية قبل 7 أيام.","عدم إجراء الفحص أثناء الدورة الشهرية."],
  sampling_fr:["Prélèvement réalisé par une sage-femme ou un gynécologue à l'aide d'un spéculum."],
  sampling_ar:["يُجرى الفحص من قبل قابلة أو طبيبة نسائية باستخدام منظار."],
  meds_fr:["Signaler tout traitement antifongique ou antibiotique local récent."],
  meds_ar:["إبلاغ عن أي علاج مضاد للفطريات أو مضاد حيوي موضعي حديث."],
  note_fr:"Éviter la toilette intime le jour même de l'examen (fausse la flore).",
  note_ar:"تجنب النظافة الحميمة في يوم الفحص نفسه (تؤثر على الفلورا)." },

{ id:45, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Coproculture (analyse des selles)', name_ar:'زرع البراز',
  summary_fr:"Recherche de bactéries pathogènes intestinales (Salmonella, Shigella...).",
  summary_ar:"البحث عن جراثيم معوية ممرضة (السالمونيلا، الشيغيلا...).",
  prep_fr:["Ne pas être sous antibiotique depuis 15 jours.","Éviter les traitements contre la diarrhée avant le prélèvement.","Recueillir dans le pot stérile, éviter contact avec l'urine."],
  prep_ar:["عدم تناول مضادات حيوية منذ 15 يوماً.","تجنب أدوية الإسهال قبل أخذ العينة.","الجمع في الوعاء المعقم، تجنب التلامس مع البول."],
  sampling_fr:["Recueillir une petite quantité de selles fraîches (taille d'une noix).","Apporter au laboratoire dans les 2 heures, ou conserver au réfrigérateur (pas au congélateur)."],
  sampling_ar:["جمع كمية صغيرة من البراز الطازج (بحجم الجوزة).","إحضاره للمخبر خلال ساعتين، أو حفظه في الثلاجة (وليس المجمدة)."],
  meds_fr:["Signaler impérativement toute antibiothérapie récente."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج حديث بالمضادات الحيوية."],
  note_fr:"Souvent demandé en 3 échantillons successifs (3 jours différents) pour plus de fiabilité.",
  note_ar:"غالباً ما يُطلب على 3 عينات متتالية (3 أيام مختلفة) لمزيد من الموثوقية." },

{ id:46, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement de plaie / pus', name_ar:'مسحة الجرح / القيح',
  summary_fr:"Identifie la bactérie responsable d'une infection cutanée.",
  summary_ar:"يحدد الجرثومة المسؤولة عن التهاب جلدي.",
  prep_fr:["Ne pas appliquer d'antiseptique ou de pommade antibiotique juste avant.","Nettoyer la peau autour de la plaie (pas la plaie elle-même) avant le prélèvement."],
  prep_ar:["عدم وضع مطهر أو مرهم مضاد حيوي قبل الفحص مباشرة.","تنظيف الجلد المحيط بالجرح (وليس الجرح نفسه) قبل أخذ العينة."],
  sampling_fr:["Écouvillonnage réalisé par le personnel médical au niveau de la plaie."],
  sampling_ar:["يقوم الطاقم الطبي بمسح مكان الجرح."],
  meds_fr:["Signaler tout traitement antibiotique local ou systémique en cours."],
  meds_ar:["إبلاغ عن أي علاج مضاد حيوي موضعي أو جهازي جارٍ."],
  note_fr:"Résultat avec antibiogramme disponible en 48-72h.",
  note_ar:"النتيجة مع اختبار الحساسية متوفرة خلال 48-72 ساعة." },

{ id:47, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon nasal',n_ar:'مسحة أنفية'}],
  name_fr:'Prélèvement nasal', name_ar:'المسحة الأنفية',
  summary_fr:"Recherche de portage bactérien (staphylocoque doré) ou infection respiratoire.",
  summary_ar:"البحث عن حمل جرثومي (المكورات العنقودية الذهبية) أو عدوى تنفسية.",
  prep_fr:["Ne pas utiliser de spray nasal ou de gouttes avant le prélèvement.","Ne pas se moucher juste avant le test."],
  prep_ar:["عدم استخدام بخاخ أنفي أو قطرات قبل أخذ العينة.","عدم تمخيط الأنف قبل الفحص مباشرة."],
  sampling_fr:["Écouvillonnage doux de chaque narine."],
  sampling_ar:["مسح لطيف لكل فتحة أنف."],
  meds_fr:["Signaler tout traitement antibiotique local nasal en cours."],
  meds_ar:["إبلاغ عن أي علاج مضاد حيوي أنفي موضعي جارٍ."],
  note_fr:"Utilisé notamment pour le dépistage de SARM avant hospitalisation.",
  note_ar:"يُستخدم خاصة للكشف عن المكورات المقاومة قبل دخول المستشفى." },

{ id:48, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Crachoir stérile',n_ar:'وعاء بلغم معقم'}],
  name_fr:'Examen cytobactériologique des crachats (ECBC)', name_ar:'التحليل الجرثومي للبلغم',
  summary_fr:"Recherche d'infection pulmonaire bactérienne.",
  summary_ar:"البحث عن عدوى بكتيرية رئوية.",
  prep_fr:["Se rincer la bouche à l'eau claire avant (sans dentifrice ni bain de bouche).","Prélèvement de préférence le matin au réveil.","Cracher profondément, pas simplement de la salive."],
  prep_ar:["شطف الفم بالماء النظيف قبل الفحص (دون معجون أسنان أو غسول).","يفضل أخذ العينة في الصباح عند الاستيقاظ.","البصق من الأعماق، وليس مجرد لعاب."],
  sampling_fr:["Recueillir dans le crachoir stérile après une toux profonde."],
  sampling_ar:["الجمع في الوعاء المعقم بعد سعال عميق."],
  meds_fr:["Signaler antibiothérapie en cours ou récente."],
  meds_ar:["إبلاغ عن العلاج بالمضادات الحيوية الجاري أو الحديث."],
  note_fr:"Un échantillon salivaire (sans mucosités) sera rejeté par le laboratoire.",
  note_ar:"عينة اللعاب فقط (دون بلغم) سيتم رفضها من قبل المخبر." },

{ id:49, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Tube stérile spécifique',n_ar:'أنبوب معقم خاص'}],
  name_fr:'Recherche de BK (Bacille de Koch / Tuberculose)', name_ar:'البحث عن عصية كوخ (السل)',
  summary_fr:"Dépistage de la tuberculose pulmonaire par examen des crachats.",
  summary_ar:"الكشف عن السل الرئوي عن طريق فحص البلغم.",
  prep_fr:["Recueillir 3 échantillons de crachats sur 3 jours consécutifs, de préférence le matin.","Se rincer la bouche à l'eau avant chaque prélèvement.","Signaler la suspicion clinique au laboratoire (délai d'analyse spécifique)."],
  prep_ar:["جمع 3 عينات بلغم على مدى 3 أيام متتالية، يفضل في الصباح.","شطف الفم بالماء قبل كل عينة.","إبلاغ المخبر بالاشتباه السريري (مدة تحليل خاصة)."],
  sampling_fr:["Cracher profondément dans le récipient stérile fourni, à jeun de préférence.","Fermer hermétiquement et transporter rapidement au laboratoire."],
  sampling_ar:["البصق من الأعماق في الوعاء المعقم المقدم، يفضل على الريق.","إغلاقه بإحكام ونقله بسرعة إلى المخبر."],
  meds_fr:["Signaler impérativement tout traitement antituberculeux déjà commencé."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج مضاد للسل بدأ بالفعل."],
  note_fr:"Analyse réalisée dans les laboratoires antituberculeux agréés (délai de culture jusqu'à 6-8 semaines).",
  note_ar:"التحليل يُجرى في المخابر المعتمدة لمكافحة السل (مدة الزرع قد تصل إلى 6-8 أسابيع)." },

{ id:50, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'ECBU chez la femme enceinte', name_ar:'التحليل الجرثومي للبول عند الحامل',
  summary_fr:"Dépistage systématique mensuel de bactériurie asymptomatique.",
  summary_ar:"الكشف الشهري المنتظم عن بيلة جرثومية بدون أعراض.",
  prep_fr:["Toilette intime rigoureuse avant le prélèvement.","Recueillir les urines du milieu du jet.","Premier jet du matin de préférence."],
  prep_ar:["نظافة حميمة دقيقة قبل أخذ العينة.","جمع البول من منتصف التبول.","يفضل أول تبول في الصباح."],
  sampling_fr:["Recueillir 20-30 mL dans le pot stérile.","Apporter au laboratoire dans l'heure."],
  sampling_ar:["جمع 20-30 مل في الوعاء المعقم.","إحضاره للمخبر خلال ساعة."],
  meds_fr:["Signaler tout traitement antibiotique en cours ou récent."],
  meds_ar:["إبلاغ عن أي علاج بمضاد حيوي جارٍ أو حديث."],
  note_fr:"Examen recommandé chaque mois durant la grossesse, même sans symptômes.",
  note_ar:"يُنصح بإجراء الفحص كل شهر خلال الحمل، حتى بدون أعراض." },


/* ── HORMONOLOGIE ───────────────────────────────────────────── */
{ id:51, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'TSH (Thyréostimuline)', name_ar:'الهرمون المحفز للغدة الدرقية TSH',
  summary_fr:"Test de dépistage de première intention des troubles thyroïdiens.",
  summary_ar:"فحص أولي للكشف عن اضطرابات الغدة الدرقية.",
  prep_fr:["Jeûne non obligatoire.","Prélèvement de préférence le matin (variation circadienne).","Éviter la biotine (vitamine B8) 48h avant si dose élevée."],
  prep_ar:["الصيام غير إلزامي.","يفضل أخذ العينة صباحاً (تغير حسب الساعة البيولوجية).","تجنب البيوتين (فيتامين B8) قبل 48 ساعة إذا كانت الجرعة عالية."],
  sampling_fr:["Prélèvement veineux simple, idéalement entre 7h et 10h."],
  sampling_ar:["أخذ عينة وريدية بسيطة، يفضل بين 7 و10 صباحاً."],
  meds_fr:["Signaler traitement thyroïdien (Levothyrox) et son heure de prise.","Signaler amiodarone, lithium, corticoïdes."],
  meds_ar:["إبلاغ عن علاج الغدة الدرقية ووقت تناوله.","إبلاغ عن الأميودارون، الليثيوم، الكورتيزون."],
  note_fr:"Si sous Levothyrox, prélever avant la prise du matin pour un dosage fiable.",
  note_ar:"إذا كان المريض تحت علاج الغدة الدرقية، يجب أخذ العينة قبل جرعة الصباح لنتيجة دقيقة." },

{ id:52, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'T3 / T4 libres', name_ar:'T3 / T4 الحرة',
  summary_fr:"Hormones thyroïdiennes actives, complètent le bilan de la TSH.",
  summary_ar:"هرمونات الغدة الدرقية الفعالة، تكمل فحص TSH.",
  prep_fr:["Jeûne non obligatoire.","Prélèvement matinal recommandé."],
  prep_ar:["الصيام غير إلزامي.","يُنصح بأخذ العينة صباحاً."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler impérativement le traitement thyroïdien en cours et l'horaire de la dernière prise."],
  meds_ar:["إبلاغ إلزامياً عن علاج الغدة الدرقية الجاري ووقت آخر جرعة."],
  note_fr:"La grossesse modifie physiologiquement ces valeurs — à signaler.",
  note_ar:"الحمل يغير هذه القيم فيزيولوجياً — يجب الإبلاغ عنه." },

{ id:53, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Prolactine', name_ar:'البرولاكتين',
  summary_fr:"Hormone liée à la lactation, son excès peut causer infertilité.",
  summary_ar:"هرمون مرتبط بالإرضاع، زيادته قد تسبب العقم.",
  prep_fr:["Rester au repos 20-30 min avant le prélèvement (le stress augmente la prolactine).","Éviter rapports sexuels et stimulation des seins 24h avant.","Prélèvement de préférence le matin, à distance des repas."],
  prep_ar:["الراحة لمدة 20-30 دقيقة قبل أخذ العينة (التوتر يرفع البرولاكتين).","تجنب العلاقة الجنسية وتحفيز الثدي قبل 24 ساعة.","يفضل أخذ العينة صباحاً، بعيداً عن الوجبات."],
  sampling_fr:["Prélèvement veineux après repos, éviter le stress juste avant."],
  sampling_ar:["أخذ عينة وريدية بعد الراحة، تجنب التوتر قبلها مباشرة."],
  meds_fr:["Signaler antidépresseurs, antipsychotiques, antiémétiques (dompéridone)."],
  meds_ar:["إبلاغ عن مضادات الاكتئاب، مضادات الذهان، مضادات القيء."],
  note_fr:"Le simple stress du prélèvement peut faussement l'élever — repos indispensable.",
  note_ar:"مجرد التوتر من أخذ العينة قد يرفعها بشكل خاطئ — الراحة ضرورية." },

{ id:54, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'FSH / LH', name_ar:'FSH / LH',
  summary_fr:"Hormones de la reproduction, explorent la fertilité et la ménopause.",
  summary_ar:"هرمونات التكاثر، تفحص الخصوبة وسن اليأس.",
  prep_fr:["Chez la femme : prélèvement au 3e jour du cycle menstruel (sauf indication contraire).","Aucun jeûne nécessaire."],
  prep_ar:["عند المرأة: أخذ العينة في اليوم الثالث من الدورة الشهرية (إلا إذا طُلب غير ذلك).","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple, dater précisément le jour du cycle."],
  sampling_ar:["أخذ عينة وريدية بسيطة، تحديد يوم الدورة بدقة."],
  meds_fr:["Signaler contraceptifs hormonaux et traitements de fertilité."],
  meds_ar:["إبلاغ عن موانع الحمل الهرمونية وعلاجات الخصوبة."],
  note_fr:"Le jour du cycle doit être précisé sur l'ordonnance pour une interprétation correcte.",
  note_ar:"يجب تحديد يوم الدورة على الوصفة الطبية للتفسير الصحيح." },

{ id:55, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Œstradiol', name_ar:'الإستراديول',
  summary_fr:"Hormone féminine principale, suivi de fertilité et de ménopause.",
  summary_ar:"الهرمون الأنثوي الرئيسي، متابعة الخصوبة وسن اليأس.",
  prep_fr:["Prélèvement daté précisément selon le cycle menstruel (souvent J3).","Aucun jeûne requis."],
  prep_ar:["أخذ العينة بتاريخ دقيق حسب الدورة الشهرية (غالباً اليوم 3).","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement hormonal substitutif ou contraceptif."],
  meds_ar:["إبلاغ عن العلاج الهرموني البديل أو موانع الحمل."],
  note_fr:"Essentiel dans le suivi de stimulation ovarienne (FIV).",
  note_ar:"ضروري في متابعة تحفيز المبايض (التلقيح الاصطناعي)." },

{ id:56, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Progestérone', name_ar:'البروجسترون',
  summary_fr:"Hormone confirmant l'ovulation, surveillance de grossesse précoce.",
  summary_ar:"هرمون يؤكد الإباضة، متابعة الحمل المبكر.",
  prep_fr:["Prélèvement au 21e jour du cycle (sauf autre indication) pour vérifier l'ovulation.","Aucun jeûne nécessaire."],
  prep_ar:["أخذ العينة في اليوم 21 من الدورة (إلا إذا طُلب غير ذلك) للتحقق من الإباضة.","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement de fertilité en cours (Duphaston, Utrogestan)."],
  meds_ar:["إبلاغ عن علاج الخصوبة الجاري."],
  note_fr:"Le jour du cycle est essentiel pour l'interprétation — le noter précisément.",
  note_ar:"يوم الدورة أساسي للتفسير — يجب تدوينه بدقة." },

{ id:57, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Testostérone', name_ar:'التستوستيرون',
  summary_fr:"Hormone masculine principale, explore l'hirsutisme et l'infertilité.",
  summary_ar:"الهرمون الذكري الرئيسي، يفحص الشعرانية والعقم.",
  prep_fr:["Prélèvement le matin entre 7h et 10h (pic circadien).","Aucun jeûne obligatoire."],
  prep_ar:["أخذ العينة صباحاً بين 7 و10 (ذروة الساعة البيولوجية).","الصيام غير إلزامي."],
  sampling_fr:["Prélèvement veineux simple, le matin de préférence."],
  sampling_ar:["أخذ عينة وريدية بسيطة، يفضل صباحاً."],
  meds_fr:["Signaler anabolisants et traitements hormonaux."],
  meds_ar:["إبلاغ عن المنشطات والعلاجات الهرمونية."],
  note_fr:"Varie fortement selon l'heure — toujours prélever le matin.",
  note_ar:"يتغير بشدة حسب الوقت — يجب أخذ العينة دائماً في الصباح." },

{ id:58, cat:'hormonologie', fasting:8, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Cortisol', name_ar:'الكورتيزول',
  summary_fr:"Hormone du stress, explore la fonction surrénalienne.",
  summary_ar:"هرمون التوتر، يفحص وظيفة الغدة الكظرية.",
  prep_fr:["Prélèvement le matin entre 7h et 9h (pic circadien) à jeun de préférence.","Éviter le stress et l'effort physique avant le prélèvement.","Bien dormir la nuit précédente."],
  prep_ar:["أخذ العينة صباحاً بين 7 و9 (ذروة الساعة البيولوجية) يفضل على الريق.","تجنب التوتر والمجهود البدني قبل أخذ العينة.","النوم الجيد في الليلة السابقة."],
  sampling_fr:["Prélèvement veineux le matin, parfois répété le soir pour comparaison (cycle nycthéméral)."],
  sampling_ar:["أخذ عينة وريدية صباحاً، أحياناً تُكرر مساءً للمقارنة (الدورة اليومية)."],
  meds_fr:["Signaler corticothérapie en cours (même locale ou inhalée).","Signaler contraceptifs oraux."],
  meds_ar:["إبلاغ عن العلاج بالكورتيزون الجاري (حتى الموضعي أو الاستنشاقي).","إبلاغ عن حبوب منع الحمل."],
  note_fr:"Le stress de la prise de sang elle-même peut fausser le résultat à la hausse.",
  note_ar:"التوتر من أخذ العينة نفسه قد يرفع النتيجة بشكل خاطئ." },

{ id:59, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Insulinémie', name_ar:'الأنسولين في الدم',
  summary_fr:"Mesure de l'insuline, utile pour explorer une insulinorésistance.",
  summary_ar:"قياس الأنسولين، مفيد لفحص مقاومة الأنسولين.",
  prep_fr:["Jeûne strict de 12 heures.","Réalisé souvent en même temps que la glycémie à jeun."],
  prep_ar:["صيام صارم لمدة 12 ساعة.","غالباً ما يُجرى مع فحص السكر على الريق."],
  sampling_fr:["Prélèvement veineux le matin à jeun."],
  sampling_ar:["أخذ عينة وريدية صباحاً على الريق."],
  meds_fr:["Signaler traitement antidiabétique en cours, notamment insuline injectée."],
  meds_ar:["إبلاغ عن علاج السكري الجاري، خاصة الأنسولين المحقون."],
  note_fr:"Le non-respect du jeûne invalide totalement l'interprétation HOMA.",
  note_ar:"عدم احترام الصيام يبطل تماماً تفسير مؤشر HOMA." },

{ id:60, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'PTH (Parathormone)', name_ar:'هرمون جارات الدرقية PTH',
  summary_fr:"Régule le calcium, explore les troubles des glandes parathyroïdes.",
  summary_ar:"ينظم الكالسيوم، يفحص اضطرابات الغدد جارات الدرقية.",
  prep_fr:["Jeûne de 8h recommandé.","Prélèvement le matin de préférence (variation circadienne).","Transport rapide au laboratoire (hormone instable)."],
  prep_ar:["يُنصح بصيام 8 ساعات.","يفضل أخذ العينة صباحاً (تغير حسب الساعة البيولوجية).","نقل سريع إلى المخبر (هرمون غير مستقر)."],
  sampling_fr:["Prélèvement veineux le matin, tube glacé si transport long."],
  sampling_ar:["أخذ عينة وريدية صباحاً، أنبوب مبرد إذا كان النقل طويلاً."],
  meds_fr:["Signaler suppléments calciques et vitamine D."],
  meds_ar:["إبلاغ عن مكملات الكالسيوم وفيتامين د."],
  note_fr:"Toujours interprétée conjointement avec la calcémie du même jour.",
  note_ar:"تُفسَّر دائماً مع مستوى الكالسيوم في نفس اليوم." },

{ id:61, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Beta-hCG (Test de grossesse sanguin)', name_ar:'فحص الحمل الدموي Beta-hCG',
  summary_fr:"Confirme une grossesse avec plus de précision qu'un test urinaire.",
  summary_ar:"يؤكد الحمل بدقة أكبر من فحص البول.",
  prep_fr:["Aucun jeûne nécessaire.","Peut être réalisé à tout moment de la journée."],
  prep_ar:["لا حاجة للصيام.","يمكن إجراؤه في أي وقت من اليوم."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Détectable dès 8-10 jours après la fécondation, plus précoce que le test urinaire.",
  note_ar:"يمكن الكشف عنه بعد 8-10 أيام من الإخصاب، أبكر من فحص البول." },

{ id:62, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'AMH (Hormone Anti-Müllérienne)', name_ar:'الهرمون المضاد للمولر AMH',
  summary_fr:"Évalue la réserve ovarienne, utile en bilan de fertilité.",
  summary_ar:"يقيّم المخزون المبيضي، مفيد في فحص الخصوبة.",
  prep_fr:["Peut être prélevé à n'importe quel jour du cycle.","Aucun jeûne nécessaire."],
  prep_ar:["يمكن أخذها في أي يوم من الدورة الشهرية.","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler contraceptifs hormonaux (peuvent légèrement diminuer les valeurs)."],
  meds_ar:["إبلاغ عن موانع الحمل الهرمونية (قد تخفض القيم قليلاً)."],
  note_fr:"Contrairement à la FSH, ne nécessite pas d'être daté précisément dans le cycle.",
  note_ar:"على عكس FSH، لا يتطلب تحديد يوم دقيق في الدورة." },

/* ── IMMUNOLOGIE ────────────────────────────────────────────── */
{ id:63, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Facteur Rhumatoïde (FR)', name_ar:'العامل الروماتويدي',
  summary_fr:"Dépistage de la polyarthrite rhumatoïde.",
  summary_ar:"الكشف عن التهاب المفاصل الروماتويدي.",
  prep_fr:["Aucun jeûne nécessaire.","Aucune préparation spéciale."],
  prep_ar:["لا حاجة للصيام.","لا تحضير خاص."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler anti-inflammatoires et immunosuppresseurs en cours."],
  meds_ar:["إبلاغ عن مضادات الالتهاب ومثبطات المناعة الجارية."],
  note_fr:"Peut être positif dans d'autres maladies auto-immunes, pas spécifique à 100%.",
  note_ar:"قد يكون إيجابياً في أمراض مناعية أخرى، ليس خاصاً بنسبة 100%." },

{ id:64, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-nucléaires (AAN/ANA)', name_ar:'الأجسام المضادة للنواة',
  summary_fr:"Dépistage du lupus et autres maladies auto-immunes systémiques.",
  summary_ar:"الكشف عن الذئبة الحمراء وأمراض مناعية جهازية أخرى.",
  prep_fr:["Aucun jeûne nécessaire.","Aucune préparation spéciale."],
  prep_ar:["لا حاجة للصيام.","لا تحضير خاص."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler certains médicaments pouvant induire un lupus (hydralazine, procaïnamide)."],
  meds_ar:["إبلاغ عن بعض الأدوية التي قد تسبب ذئبة دوائية."],
  note_fr:"Un résultat positif isolé n'est pas suffisant pour un diagnostic — contexte clinique nécessaire.",
  note_ar:"نتيجة إيجابية منفردة غير كافية للتشخيص — يلزم السياق السريري." },

{ id:65, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anti-CCP (Peptides cycliques citrullinés)', name_ar:'الأجسام المضادة CCP',
  summary_fr:"Marqueur très spécifique de la polyarthrite rhumatoïde.",
  summary_ar:"مؤشر خاص جداً لالتهاب المفاصل الروماتويدي.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement immunosuppresseur en cours."],
  meds_ar:["إبلاغ عن علاج مثبط للمناعة جارٍ."],
  note_fr:"Plus spécifique que le facteur rhumatoïde pour le diagnostic précoce.",
  note_ar:"أكثر خصوصية من العامل الروماتويدي للتشخيص المبكر." },

{ id:66, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Complément (C3, C4)', name_ar:'المتممة C3, C4',
  summary_fr:"Protéines du système immunitaire, utiles dans le suivi du lupus.",
  summary_ar:"بروتينات الجهاز المناعي، مفيدة في متابعة الذئبة.",
  prep_fr:["Aucun jeûne nécessaire.","Transport rapide au laboratoire (protéines fragiles)."],
  prep_ar:["لا حاجة للصيام.","نقل سريع إلى المخبر (بروتينات حساسة)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement immunosuppresseur ou biothérapie."],
  meds_ar:["إبلاغ عن العلاج المثبط للمناعة أو العلاج البيولوجي."],
  note_fr:"Diminue lors des poussées actives de maladies auto-immunes.",
  note_ar:"ينخفض أثناء النوبات النشطة للأمراض المناعية." },

{ id:67, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'IgE totales', name_ar:'الغلوبيولين المناعي E الكلي',
  summary_fr:"Marqueur d'allergie et de parasitoses.",
  summary_ar:"مؤشر على الحساسية والطفيليات.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler toute allergie connue."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن أي حساسية معروفة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler antihistaminiques et corticoïdes en cours."],
  meds_ar:["إبلاغ عن مضادات الهيستامين والكورتيزون الجاري."],
  note_fr:"Élevé en cas d'allergie, d'asthme ou d'infection parasitaire.",
  note_ar:"يرتفع في حالة الحساسية أو الربو أو العدوى الطفيلية." },

{ id:68, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage des IgG, IgA, IgM', name_ar:'قياس IgG, IgA, IgM',
  summary_fr:"Évalue les défenses immunitaires humorales de l'organisme.",
  summary_ar:"يقيّم الدفاعات المناعية الخلطية للجسم.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement immunosuppresseur, chimiothérapie récente."],
  meds_ar:["إبلاغ عن علاج مثبط للمناعة أو علاج كيميائي حديث."],
  note_fr:"Utile pour détecter des déficits immunitaires primaires ou secondaires.",
  note_ar:"مفيد للكشف عن نقص المناعة الأولي أو الثانوي." },

/* ── SÉROLOGIE ──────────────────────────────────────────────── */
{ id:69, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie VIH (Test de dépistage)', name_ar:'فحص الإيدز HIV',
  summary_fr:"Dépistage de l'infection par le VIH, réalisé de manière confidentielle.",
  summary_ar:"الكشف عن الإصابة بفيروس نقص المناعة، يُجرى بسرية تامة.",
  prep_fr:["Aucun jeûne nécessaire.","Test réalisé de manière confidentielle et anonyme si souhaité."],
  prep_ar:["لا حاجة للصيام.","يُجرى الفحص بسرية وبإمكانية عدم الكشف عن الهوية إذا رغب المريض."],
  sampling_fr:["Prélèvement veineux simple.","Consentement éclairé du patient requis."],
  sampling_ar:["أخذ عينة وريدية بسيطة.","يتطلب موافقة مستنيرة من المريض."],
  meds_fr:["Aucun médicament particulier à signaler, sauf traitement antirétroviral en cours."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة، إلا العلاج المضاد للفيروسات القهقرية الجاري."],
  note_fr:"En cas de doute ou d'exposition récente, un délai de 6 semaines est nécessaire avant fiabilité totale (fenêtre sérologique).",
  note_ar:"في حالة الشك أو التعرض الحديث، يلزم انتظار 6 أسابيع للحصول على نتيجة موثوقة تماماً (فترة النافذة المصلية)." },

{ id:70, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Hépatite B (AgHBs)', name_ar:'فحص التهاب الكبد B',
  summary_fr:"Dépistage de l'antigène de surface du virus de l'hépatite B.",
  summary_ar:"الكشف عن المستضد السطحي لفيروس التهاب الكبد B.",
  prep_fr:["Aucun jeûne nécessaire.","Test souvent demandé lors du bilan prénatal ou pré-opératoire."],
  prep_ar:["لا حاجة للصيام.","غالباً ما يُطلب أثناء فحص ما قبل الولادة أو ما قبل الجراحة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler vaccination récente contre l'hépatite B."],
  meds_ar:["إبلاغ عن التطعيم الحديث ضد التهاب الكبد B."],
  note_fr:"Obligatoire dans le bilan prénatal du 6e mois en Algérie.",
  note_ar:"إلزامي في فحص ما قبل الولادة في الشهر السادس في الجزائر." },

{ id:71, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Hépatite C (Anti-VHC)', name_ar:'فحص التهاب الكبد C',
  summary_fr:"Dépistage des anticorps contre le virus de l'hépatite C.",
  summary_ar:"الكشف عن الأجسام المضادة لفيروس التهاب الكبد C.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Si positif, une PCR virale est nécessaire pour confirmer l'infection active.",
  note_ar:"إذا كانت إيجابية، يلزم فحص PCR لتأكيد العدوى النشطة." },

{ id:72, cat:'serologie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Toxoplasmose', name_ar:'فحص داء المقوسات',
  summary_fr:"Dépistage systématique chez la femme enceinte non immunisée.",
  summary_ar:"فحص منتظم للحوامل غير المحصنات.",
  prep_fr:["Aucun jeûne obligatoire.","Test mensuel obligatoire chez la femme enceinte séronégative."],
  prep_ar:["لا يوجد صيام إلزامي.","فحص شهري إلزامي للحامل غير المحصنة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"En Algérie, surveillance mensuelle obligatoire durant toute la grossesse si séronégative.",
  note_ar:"في الجزائر، المراقبة الشهرية إلزامية طوال الحمل إذا كانت النتيجة سلبية." },

{ id:73, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Rubéole', name_ar:'فحص الحصبة الألمانية',
  summary_fr:"Vérifie l'immunité contre la rubéole, essentiel en début de grossesse.",
  summary_ar:"يتحقق من المناعة ضد الحصبة الألمانية، ضروري في بداية الحمل.",
  prep_fr:["Aucun jeûne nécessaire.","Test réalisé en début de grossesse ou avant conception."],
  prep_ar:["لا حاجة للصيام.","يُجرى الفحص في بداية الحمل أو قبل الحمل."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler vaccination récente contre la rubéole (attendre 1 mois après vaccin avant grossesse)."],
  meds_ar:["إبلاغ عن التطعيم الحديث ضد الحصبة الألمانية (الانتظار شهراً بعد التطعيم قبل الحمل)."],
  note_fr:"Si non immunisée, vaccination recommandée avant grossesse (contre-indiquée pendant la grossesse).",
  note_ar:"إذا لم تكن محصنة، يُنصح بالتطعيم قبل الحمل (ممنوع أثناء الحمل)." },

{ id:74, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Syphilis (TPHA-VDRL)', name_ar:'فحص الزهري TPHA-VDRL',
  summary_fr:"Dépistage de la syphilis, obligatoire dans le bilan prénatal.",
  summary_ar:"الكشف عن مرض الزهري، إلزامي في فحص ما قبل الولادة.",
  prep_fr:["Aucun jeûne nécessaire.","Test obligatoire dans le bilan prénatal en Algérie."],
  prep_ar:["لا حاجة للصيام.","فحص إلزامي في تقييم ما قبل الولادة في الجزائر."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler tout traitement antibiotique récent (pénicilline notamment)."],
  meds_ar:["إبلاغ عن أي علاج حديث بالمضادات الحيوية (خاصة البنسلين)."],
  note_fr:"Un résultat positif nécessite un traitement rapide, surtout pendant la grossesse.",
  note_ar:"النتيجة الإيجابية تتطلب علاجاً سريعاً، خاصة أثناء الحمل." },

{ id:75, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie CMV (Cytomégalovirus)', name_ar:'فحص الفيروس المضخم للخلايا CMV',
  summary_fr:"Dépistage lors de la grossesse ou avant greffe d'organe.",
  summary_ar:"الكشف أثناء الحمل أو قبل زراعة الأعضاء.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement immunosuppresseur en cours (chez patients transplantés)."],
  meds_ar:["إبلاغ عن علاج مثبط للمناعة جارٍ (لدى مرضى الزرع)."],
  note_fr:"Risque important si primo-infection pendant la grossesse — surveillance rapprochée nécessaire.",
  note_ar:"خطر كبير في حالة العدوى الأولى أثناء الحمل — تلزم مراقبة دقيقة." },

{ id:76, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Brucellose (Test de Wright)', name_ar:'فحص داء البروسيلات',
  summary_fr:"Dépistage de la brucellose, fréquente en Algérie (contact avec bétail, lait cru).",
  summary_ar:"الكشف عن داء البروسيلات، شائع في الجزائر (تلامس مع الماشية، الحليب غير المبستر).",
  prep_fr:["Aucun jeûne nécessaire.","Signaler contact avec des animaux ou consommation de lait/fromage non pasteurisé."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن التلامس مع الحيوانات أو استهلاك حليب/جبن غير مبستر."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler tout traitement antibiotique récent."],
  meds_ar:["إبلاغ عن أي علاج حديث بالمضادات الحيوية."],
  note_fr:"Maladie encore fréquente dans les zones rurales et d'élevage en Algérie — signaler l'exposition.",
  note_ar:"مرض لا يزال شائعاً في المناطق الريفية ومناطق تربية المواشي في الجزائر — يجب الإبلاغ عن التعرض." },

{ id:77, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Hépatite A (Anti-VHA)', name_ar:'فحص التهاب الكبد A',
  summary_fr:"Recherche d'immunité contre l'hépatite A (maladie des mains sales).",
  summary_ar:"البحث عن مناعة ضد التهاب الكبد A (مرض الأيدي غير النظيفة).",
  prep_fr:["Aucun jeûne nécessaire.","Signaler tout épisode de jaunisse récent dans l'entourage."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن أي حالة يرقان حديثة في المحيط."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler vaccination récente contre l'hépatite A."],
  meds_ar:["إبلاغ عن التطعيم الحديث ضد التهاب الكبد A."],
  note_fr:"Fréquente en Algérie chez l'enfant — souvent bénigne mais très contagieuse.",
  note_ar:"شائع في الجزائر عند الأطفال — غالباً حميد لكن معدٍ جداً." },

/* ── PARASITOLOGIE ──────────────────────────────────────────── */
{ id:78, cat:'parasitologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Examen parasitologique des selles (EPS)', name_ar:'الفحص الطفيلي للبراز',
  summary_fr:"Recherche de parasites intestinaux (vers, amibes, giardia).",
  summary_ar:"البحث عن طفيليات معوية (ديدان، أميبا، جيارديا).",
  prep_fr:["Ne pas prendre d'anti-diarrhéique ou de charbon avant le prélèvement.","Éviter les laxatifs à base de baryte ou huile avant le test.","Recueillir sur 3 jours différents si possible (parasites intermittents)."],
  prep_ar:["عدم تناول مضاد للإسهال أو الفحم قبل أخذ العينة.","تجنب الملينات الزيتية قبل الفحص.","الجمع على مدى 3 أيام مختلفة إن أمكن (طفيليات متقطعة)."],
  sampling_fr:["Recueillir une petite quantité de selles fraîches dans le pot stérile.","Apporter rapidement au laboratoire (certains parasites se dégradent vite)."],
  sampling_ar:["جمع كمية صغيرة من البراز الطازج في الوعاء المعقم.","إحضاره بسرعة للمخبر (بعض الطفيليات تتحلل بسرعة)."],
  meds_fr:["Signaler tout traitement antiparasitaire récent."],
  meds_ar:["إبلاغ عن أي علاج مضاد للطفيليات حديث."],
  note_fr:"Test très fréquent en Algérie — souvent demandé 3 fois pour fiabilité maximale.",
  note_ar:"فحص شائع جداً في الجزائر — غالباً يُطلب 3 مرات لأقصى موثوقية." },

{ id:79, cat:'parasitologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Scotch test',n_ar:'شريط لاصق'}],
  name_fr:'Scotch test (recherche d\'oxyures)', name_ar:'اختبار الشريط اللاصق (الديدان الدبوسية)',
  summary_fr:"Test simple pour détecter les oxyures, fréquent chez l'enfant.",
  summary_ar:"فحص بسيط للكشف عن الديدان الدبوسية، شائع عند الأطفال.",
  prep_fr:["Réaliser le test le matin AVANT la toilette et la selle.","Ne pas se laver la région anale avant le prélèvement.","Répéter sur 3 matins consécutifs pour plus de fiabilité."],
  prep_ar:["إجراء الفحص في الصباح قبل النظافة والتبرز.","عدم غسل منطقة الشرج قبل أخذ العينة.","التكرار على 3 صباحات متتالية لمزيد من الموثوقية."],
  sampling_fr:["Appliquer le scotch fourni sur la marge anale au réveil, avant tout lavage."],
  sampling_ar:["وضع الشريط اللاصق المقدم على منطقة الشرج عند الاستيقاظ، قبل أي غسل."],
  meds_fr:["Signaler tout traitement antiparasitaire récent (Fluvermal)."],
  meds_ar:["إبلاغ عن أي علاج مضاد للطفيليات حديث."],
  note_fr:"Le moment clé est le matin au réveil — les œufs sont pondus la nuit.",
  note_ar:"اللحظة الأساسية هي الصباح عند الاستيقاظ — البيوض تُوضع ليلاً." },

{ id:80, cat:'parasitologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Goutte épaisse (Recherche de Paludisme)', name_ar:'القطرة السميكة (البحث عن الملاريا)',
  summary_fr:"Dépistage du paludisme, essentiel après un voyage en zone endémique.",
  summary_ar:"الكشف عن الملاريا، ضروري بعد السفر لمنطقة موبوءة.",
  prep_fr:["Signaler impérativement tout voyage récent en zone d'endémie palustre.","Idéalement prélevé pendant un pic fébrile."],
  prep_ar:["إبلاغ إلزامياً عن أي سفر حديث لمنطقة موبوءة بالملاريا.","يفضل أخذ العينة أثناء ذروة الحمى."],
  sampling_fr:["Prélèvement veineux ou capillaire (piqûre au doigt)."],
  sampling_ar:["أخذ عينة وريدية أو شعرية (وخز الإصبع)."],
  meds_fr:["Signaler tout traitement antipaludéen préventif ou curatif en cours."],
  meds_ar:["إبلاغ عن أي علاج وقائي أو علاجي للملاريا جارٍ."],
  note_fr:"Urgence diagnostique — résultat à obtenir en quelques heures en cas de suspicion.",
  note_ar:"حالة تشخيصية طارئة — يجب الحصول على النتيجة خلال ساعات في حالة الاشتباه." },

{ id:81, cat:'parasitologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche de Giardia intestinalis', name_ar:'البحث عن الجيارديا المعوية',
  summary_fr:"Parasite fréquent causant diarrhée chronique et troubles digestifs.",
  summary_ar:"طفيلي شائع يسبب إسهالاً مزمناً واضطرابات هضمية.",
  prep_fr:["Ne pas prendre d'antiparasitaire avant le test.","Recueillir de préférence sur plusieurs jours (excrétion intermittente)."],
  prep_ar:["عدم تناول مضاد للطفيليات قبل الفحص.","يفضل الجمع على عدة أيام (إفراز متقطع)."],
  sampling_fr:["Recueillir un échantillon de selles fraîches dans le pot stérile."],
  sampling_ar:["جمع عينة براز طازجة في الوعاء المعقم."],
  meds_fr:["Signaler traitement antiparasitaire récent (Métronidazole)."],
  meds_ar:["إبلاغ عن علاج مضاد للطفيليات حديث."],
  note_fr:"Excrétion intermittente — plusieurs échantillons augmentent la sensibilité.",
  note_ar:"الإفراز متقطع — عدة عينات تزيد من دقة الفحص." },

{ id:82, cat:'parasitologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Hydatidose (Kyste hydatique)', name_ar:'فحص داء الكيسات المائية',
  summary_fr:"Dépistage du kyste hydatique, fréquent en Algérie (contact avec chiens/moutons).",
  summary_ar:"الكشف عن الكيس المائي، شائع في الجزائر (تلامس مع الكلاب/الأغنام).",
  prep_fr:["Aucun jeûne nécessaire.","Signaler contact avec des chiens ou élevage ovin."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن التلامس مع الكلاب أو تربية الأغنام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Maladie endémique dans les zones rurales d'Algérie — dépistage important en cas de kyste découvert à l'imagerie.",
  note_ar:"مرض متوطن في المناطق الريفية بالجزائر — الفحص مهم عند اكتشاف كيس بالتصوير." },


/* ── BIOCHIMIE — SUITE ─────────────────────────────────────── */
{ id:83, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Vitamine B12', name_ar:'فيتامين B12',
  summary_fr:"Dépistage de carence, cause fréquente d'anémie et de troubles neurologiques.",
  summary_ar:"الكشف عن النقص، سبب شائع لفقر الدم والاضطرابات العصبية.",
  prep_fr:["Jeûne de 4h recommandé.","Arrêter les compléments en B12 au moins 1 semaine avant si possible."],
  prep_ar:["يُنصح بصيام 4 ساعات.","التوقف عن مكملات B12 لمدة أسبوع على الأقل إن أمكن."],
  sampling_fr:["Prélèvement veineux simple, protégé de la lumière."],
  sampling_ar:["أخذ عينة وريدية بسيطة، محمية من الضوء."],
  meds_fr:["Signaler tout traitement par injection de vitamine B12."],
  meds_ar:["إبلاغ عن أي علاج بحقن فيتامين B12."],
  note_fr:"Fréquente chez les végétariens/végétaliens stricts et les personnes âgées.",
  note_ar:"شائع عند النباتيين الصارمين وكبار السن." },

{ id:84, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Acide folique (Vitamine B9)', name_ar:'حمض الفوليك (فيتامين B9)',
  summary_fr:"Essentiel en cas de grossesse, prévient les malformations du fœtus.",
  summary_ar:"ضروري أثناء الحمل، يمنع تشوهات الجنين.",
  prep_fr:["Jeûne de 4h recommandé.","Arrêter les compléments 1 semaine avant si possible (sauf avis contraire du médecin)."],
  prep_ar:["يُنصح بصيام 4 ساعات.","التوقف عن المكملات لمدة أسبوع قبل الفحص إن أمكن."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler prise de compléments en acide folique (souvent prescrits en grossesse)."],
  meds_ar:["إبلاغ عن تناول مكملات حمض الفوليك (توصف غالباً أثناء الحمل)."],
  note_fr:"Une supplémentation est recommandée dès le désir de grossesse en Algérie.",
  note_ar:"يُنصح بالتكميل بمجرد الرغبة في الحمل في الجزائر." },

{ id:85, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Vitamine D (25-OH)', name_ar:'فيتامين د',
  summary_fr:"Très fréquente carence en Algérie malgré l'ensoleillement — liée au mode de vie.",
  summary_ar:"نقص شائع جداً في الجزائر رغم أشعة الشمس — مرتبط بنمط الحياة.",
  prep_fr:["Aucun jeûne nécessaire.","Aucune préparation spéciale."],
  prep_ar:["لا حاجة للصيام.","لا تحضير خاص."],
  sampling_fr:["Prélèvement veineux simple, à tout moment de la journée."],
  sampling_ar:["أخذ عينة وريدية بسيطة، في أي وقت من اليوم."],
  meds_fr:["Signaler toute supplémentation récente en vitamine D."],
  meds_ar:["إبلاغ عن أي تكميل حديث بفيتامين د."],
  note_fr:"Carence très répandue en Algérie, notamment chez les femmes voilées et les personnes âgées.",
  note_ar:"النقص منتشر جداً في الجزائر، خاصة عند النساء المحجبات وكبار السن." },

{ id:86, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan martial complet (Fer + Ferritine + Transferrine)', name_ar:'الفحص الشامل للحديد',
  summary_fr:"Exploration complète du statut en fer de l'organisme.",
  summary_ar:"فحص شامل لحالة الحديد في الجسم.",
  prep_fr:["Jeûne de 12h recommandé.","Prélèvement le matin de préférence.","Arrêter les compléments en fer 24h avant."],
  prep_ar:["يُنصح بصيام 12 ساعة.","يفضل أخذ العينة صباحاً.","التوقف عن مكملات الحديد قبل 24 ساعة."],
  sampling_fr:["Prélèvement veineux simple, le matin."],
  sampling_ar:["أخذ عينة وريدية بسيطة، صباحاً."],
  meds_fr:["Signaler tout traitement martial en cours ou transfusion récente."],
  meds_ar:["إبلاغ عن أي علاج بالحديد جارٍ أو نقل دم حديث."],
  note_fr:"Le plus fiable pour diagnostiquer une anémie ferriprive est la ferritine.",
  note_ar:"الأكثر موثوقية لتشخيص فقر الدم الناتج عن نقص الحديد هو الفيريتين." },

{ id:87, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan hépatique complet', name_ar:'الفحص الشامل للكبد',
  summary_fr:"Regroupe transaminases, bilirubine, GGT, PAL pour explorer le foie.",
  summary_ar:"يجمع الإنزيمات الكبدية، البيليروبين، GGT، PAL لفحص الكبد.",
  prep_fr:["Jeûne de 8h recommandé.","Éviter alcool 48h avant.","Éviter effort physique intense la veille."],
  prep_ar:["يُنصح بصيام 8 ساعات.","تجنب الكحول قبل 48 ساعة.","تجنب المجهود البدني الشديد في اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple, le matin de préférence."],
  sampling_ar:["أخذ عينة وريدية بسيطة، يفضل صباحاً."],
  meds_fr:["Signaler tout médicament hépatotoxique (paracétamol à haute dose, certains antibiotiques)."],
  meds_ar:["إبلاغ عن أي دواء سام للكبد (باراسيتامول بجرعة عالية، بعض المضادات الحيوية)."],
  note_fr:"Souvent demandé avant chirurgie ou en cas de fatigue inexpliquée.",
  note_ar:"غالباً يُطلب قبل الجراحة أو في حالة تعب غير مفسر." },

{ id:88, cat:'biochimie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan rénal complet (Urée + Créatinine + DFG)', name_ar:'الفحص الشامل للكلى',
  summary_fr:"Évalue la fonction rénale de manière complète.",
  summary_ar:"يقيّم وظيفة الكلى بشكل شامل.",
  prep_fr:["Jeûne de 8h recommandé.","Bien s'hydrater la veille.","Éviter effort physique intense 48h avant."],
  prep_ar:["يُنصح بصيام 8 ساعات.","شرب كمية كافية من الماء في اليوم السابق.","تجنب المجهود البدني الشديد قبل 48 ساعة."],
  sampling_fr:["Prélèvement veineux le matin."],
  sampling_ar:["أخذ عينة وريدية صباحاً."],
  meds_fr:["Signaler diurétiques, IEC, AINS."],
  meds_ar:["إبلاغ عن مدرات البول، مثبطات الإنزيم المحول، مضادات الالتهاب."],
  note_fr:"Le calcul du DFG (débit de filtration glomérulaire) nécessite l'âge, le poids et le sexe du patient.",
  note_ar:"حساب معدل الترشيح الكبيبي يتطلب عمر ووزن وجنس المريض." },

{ id:89, cat:'biochimie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot urine 24h',n_ar:'وعاء بول 24 ساعة'}],
  name_fr:'Protéinurie des 24 heures', name_ar:'البروتين في البول لـ24 ساعة',
  summary_fr:"Mesure précise des protéines perdues dans les urines sur une journée complète.",
  summary_ar:"قياس دقيق للبروتينات المفقودة في البول خلال يوم كامل.",
  prep_fr:["Jeter la première urine du matin (ne pas la recueillir).","Recueillir TOUTES les urines suivantes pendant 24h, y compris celle du lendemain matin à la même heure.","Conserver le bidon au réfrigérateur ou dans un endroit frais."],
  prep_ar:["التخلص من أول بول في الصباح (عدم جمعه).","جمع كل البول اللاحق لمدة 24 ساعة، بما في ذلك بول صباح اليوم التالي في نفس الوقت.","حفظ الوعاء في الثلاجة أو مكان بارد."],
  sampling_fr:["Recueillir dans le bidon fourni par le laboratoire, noter l'heure de début et de fin.","Apporter le volume total au laboratoire."],
  sampling_ar:["الجمع في الوعاء المقدم من المخبر، تدوين وقت البداية والنهاية.","إحضار الكمية الكاملة إلى المخبر."],
  meds_fr:["Signaler diurétiques et anti-inflammatoires en cours."],
  meds_ar:["إبلاغ عن مدرات البول ومضادات الالتهاب الجارية."],
  note_fr:"Le recueil doit être complet et précis — un oubli de miction fausse totalement le résultat.",
  note_ar:"يجب أن يكون الجمع كاملاً ودقيقاً — نسيان تبول واحد يشوه النتيجة بالكامل." },

{ id:90, cat:'biochimie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot urine simple',n_ar:'وعاء بول بسيط'}],
  name_fr:'Microalbuminurie', name_ar:'الألبومين الدقيق في البول',
  summary_fr:"Dépistage précoce de complication rénale du diabète et de l'hypertension.",
  summary_ar:"الكشف المبكر عن مضاعفات الكلى الناتجة عن السكري وارتفاع ضغط الدم.",
  prep_fr:["Éviter effort physique intense avant le prélèvement.","Éviter en cas d'infection urinaire ou de règles (fausse le résultat).","Prélèvement de préférence le matin."],
  prep_ar:["تجنب المجهود البدني الشديد قبل أخذ العينة.","تجنب الفحص في حالة التهاب المسالك البولية أو الدورة الشهرية.","يفضل أخذ العينة صباحاً."],
  sampling_fr:["Recueillir un échantillon d'urine simple dans le pot stérile."],
  sampling_ar:["جمع عينة بول بسيطة في الوعاء المعقم."],
  meds_fr:["Signaler traitement antihypertenseur ou antidiabétique."],
  meds_ar:["إبلاغ عن علاج ضغط الدم أو السكري."],
  note_fr:"Examen annuel recommandé chez tout patient diabétique en Algérie.",
  note_ar:"يُنصح بالفحص السنوي لكل مريض سكري في الجزائر." },

{ id:91, cat:'biochimie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot urine 24h',n_ar:'وعاء بول 24 ساعة'}],
  name_fr:'Clairance de la créatinine (urines 24h)', name_ar:'تصفية الكرياتينين',
  summary_fr:"Mesure précise de la fonction de filtration rénale.",
  summary_ar:"قياس دقيق لوظيفة الترشيح الكلوي.",
  prep_fr:["Recueil des urines de 24h selon le même protocole que la protéinurie.","Prélèvement sanguin de créatinine le même jour."],
  prep_ar:["جمع البول لمدة 24 ساعة بنفس بروتوكول البروتين في البول.","أخذ عينة دم للكرياتينين في نفس اليوم."],
  sampling_fr:["Recueil urinaire complet + prélèvement veineux le matin de la remise du bidon."],
  sampling_ar:["جمع كامل للبول + أخذ عينة وريدية صباح تسليم الوعاء."],
  meds_fr:["Signaler diurétiques et médicaments néphrotoxiques."],
  meds_ar:["إبلاغ عن مدرات البول والأدوية السامة للكلى."],
  note_fr:"Nécessite la coordination exacte entre recueil urinaire et prise de sang.",
  note_ar:"يتطلب تنسيقاً دقيقاً بين جمع البول وأخذ عينة الدم." },

{ id:92, cat:'biochimie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan pré-opératoire standard', name_ar:'الفحص القياسي قبل الجراحة',
  summary_fr:"Ensemble d'analyses demandées avant toute intervention chirurgicale.",
  summary_ar:"مجموعة تحاليل تُطلب قبل أي عملية جراحية.",
  prep_fr:["Jeûne de 12h obligatoire (glycémie incluse dans le bilan).","Arrêter certains traitements selon avis anesthésiste (anticoagulants notamment)."],
  prep_ar:["صيام إلزامي لمدة 12 ساعة (يشمل فحص السكر).","التوقف عن بعض العلاجات حسب رأي طبيب التخدير (خاصة مضادات التخثر)."],
  sampling_fr:["Prélèvement veineux le matin, plusieurs tubes selon les analyses demandées (NFS, TP/TCA, groupage, ionogramme)."],
  sampling_ar:["أخذ عينة وريدية صباحاً، عدة أنابيب حسب التحاليل المطلوبة."],
  meds_fr:["Signaler impérativement TOUS les traitements en cours à l'anesthésiste."],
  meds_ar:["إبلاغ إلزامياً عن جميع العلاجات الجارية لطبيب التخدير."],
  note_fr:"Toujours apporter la liste complète de vos médicaments habituels le jour du prélèvement.",
  note_ar:"إحضار قائمة كاملة بالأدوية المعتادة دائماً يوم أخذ العينة." },

{ id:93, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Osmolarité sanguine', name_ar:'الضغط الأسموزي للدم',
  summary_fr:"Évalue l'équilibre hydrique de l'organisme.",
  summary_ar:"يقيّم التوازن المائي للجسم.",
  prep_fr:["Aucun jeûne obligatoire.","Signaler l'état d'hydratation récent (vomissements, diarrhée)."],
  prep_ar:["لا يوجد صيام إلزامي.","إبلاغ عن حالة الترطيب الأخيرة (قيء، إسهال)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler diurétiques et perfusions récentes."],
  meds_ar:["إبلاغ عن مدرات البول والتسريب الحديث."],
  note_fr:"Souvent demandée en contexte de déshydratation sévère ou de troubles de la conscience.",
  note_ar:"غالباً تُطلب في حالة الجفاف الشديد أو اضطرابات الوعي." },

{ id:94, cat:'biochimie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Plombémie (Dosage du plomb)', name_ar:'قياس الرصاص في الدم',
  summary_fr:"Dépistage du saturnisme, notamment en milieu professionnel exposé.",
  summary_ar:"الكشف عن التسمم بالرصاص، خاصة في بيئة العمل المعرضة.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler toute exposition professionnelle (peinture, batteries, plomberie)."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن أي تعرض مهني (طلاء، بطاريات، سباكة)."],
  sampling_fr:["Prélèvement veineux dans un tube spécial sans plomb."],
  sampling_ar:["أخذ عينة وريدية في أنبوب خاص خالٍ من الرصاص."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Examen de médecine du travail obligatoire dans certaines professions exposées en Algérie.",
  note_ar:"فحص طب العمل إلزامي في بعض المهن المعرضة في الجزائر." },

{ id:95, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Cholinestérase', name_ar:'الكولينستيراز',
  summary_fr:"Marqueur de synthèse hépatique et de surveillance d'intoxication aux pesticides.",
  summary_ar:"مؤشر التصنيع الكبدي ومراقبة التسمم بالمبيدات.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler exposition récente à des pesticides organophosphorés."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن التعرض الحديث لمبيدات الفوسفات العضوية."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement anesthésique récent (succinylcholine)."],
  meds_ar:["إبلاغ عن التخدير الحديث."],
  note_fr:"Important chez les agriculteurs exposés aux pesticides en zones rurales algériennes.",
  note_ar:"مهم عند الفلاحين المعرضين للمبيدات في المناطق الريفية الجزائرية." },

/* ── HÉMATOLOGIE — SUITE ──────────────────────────────────── */
{ id:96, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Numération plaquettaire isolée', name_ar:'عد الصفائح الدموية',
  summary_fr:"Contrôle du taux de plaquettes, souvent en suivi de traitement.",
  summary_ar:"مراقبة مستوى الصفائح الدموية، غالباً لمتابعة العلاج.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement anticoagulant, chimiothérapie, héparine."],
  meds_ar:["إبلاغ عن العلاج المضاد للتخثر، العلاج الكيميائي، الهيبارين."],
  note_fr:"Une fausse thrombopénie peut survenir par agrégation des plaquettes dans le tube — à vérifier au frottis si doute.",
  note_ar:"قد يحدث نقص صفائح كاذب بسبب تكتل الصفائح في الأنبوب — يجب التحقق بمسحة الدم عند الشك." },

{ id:97, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Test de Coombs direct', name_ar:'اختبار كومبس المباشر',
  summary_fr:"Dépistage d'anémie hémolytique auto-immune.",
  summary_ar:"الكشف عن فقر الدم الانحلالي المناعي الذاتي.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler transfusion sanguine récente."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن نقل الدم الحديث."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler certains antibiotiques et méthyldopa."],
  meds_ar:["إبلاغ عن بعض المضادات الحيوية والميثيل دوبا."],
  note_fr:"Également réalisé en systématique chez le nouveau-né de mère Rhésus négatif.",
  note_ar:"يُجرى أيضاً بشكل منتظم عند المولود من أم بفصيلة دم سلبية." },

{ id:98, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'},{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'RAI (Recherche d\'Agglutinines Irrégulières)', name_ar:'البحث عن الأجسام المضادة غير المنتظمة',
  summary_fr:"Obligatoire avant transfusion et systématique durant la grossesse.",
  summary_ar:"إلزامي قبل نقل الدم ومنتظم أثناء الحمل.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler antécédents de transfusion ou grossesses précédentes."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن سوابق نقل الدم أو حمل سابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Chez la femme enceinte Rhésus négatif, réalisé à plusieurs reprises durant la grossesse.",
  note_ar:"عند الحامل ذات الفصيلة السلبية، يُجرى عدة مرات خلال الحمل." },

{ id:99, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Myélogramme (ponction de moelle osseuse)', name_ar:'خزعة نخاع العظم',
  summary_fr:"Examen de la moelle osseuse, réalisé en milieu hospitalier spécialisé.",
  summary_ar:"فحص نخاع العظم، يُجرى في وسط استشفائي متخصص.",
  prep_fr:["Réalisé à l'hôpital, généralement à jeun si anesthésie locale profonde.","Signaler tout trouble de la coagulation connu."],
  prep_ar:["يُجرى في المستشفى، عادة على الريق إذا كان التخدير الموضعي عميقاً.","إبلاغ عن أي اضطراب معروف في التخثر."],
  sampling_fr:["Ponction réalisée par un médecin spécialiste au niveau du sternum ou de la crête iliaque."],
  sampling_ar:["يُجرى الثقب من قبل طبيب متخصص في مستوى عظم القص أو الحرقفة."],
  meds_fr:["Signaler impérativement tout traitement anticoagulant."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج مضاد للتخثر."],
  note_fr:"Examen réalisé uniquement en milieu hospitalier par un hématologue.",
  note_ar:"يُجرى الفحص فقط في وسط استشفائي من قبل طبيب أمراض الدم." },

{ id:100, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Test de falciformation (drépanocytose)', name_ar:'اختبار فقر الدم المنجلي',
  summary_fr:"Dépistage de la drépanocytose, particulièrement pertinent en Algérie.",
  summary_ar:"الكشف عن فقر الدم المنجلي، مهم بشكل خاص في الجزائر.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler antécédents familiaux de drépanocytose."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن سوابق عائلية لفقر الدم المنجلي."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler transfusion récente."],
  meds_ar:["إبلاغ عن نقل الدم الحديث."],
  note_fr:"Souvent réalisé lors du bilan prénuptial en Algérie.",
  note_ar:"غالباً يُجرى أثناء الفحص قبل الزواج في الجزائر." },

/* ── COAGULATION — SUITE ─────────────────────────────────── */
{ id:101, cat:'coagulation', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Temps de saignement', name_ar:'زمن النزيف',
  summary_fr:"Évalue la fonction plaquettaire lors du saignement.",
  summary_ar:"يقيّم وظيفة الصفائح الدموية أثناء النزيف.",
  prep_fr:["Éviter aspirine et AINS 7 jours avant (sauf avis médical contraire)."],
  prep_ar:["تجنب الأسبرين ومضادات الالتهاب قبل 7 أيام (إلا برأي طبي مخالف)."],
  sampling_fr:["Réalisé par incision cutanée standardisée sur l'avant-bras par le technicien."],
  sampling_ar:["يُجرى بشق جلدي موحد على الساعد من قبل الفني."],
  meds_fr:["Signaler impérativement aspirine, clopidogrel, AINS."],
  meds_ar:["إبلاغ إلزامياً عن الأسبرين، كلوبيدوغريل، مضادات الالتهاب."],
  note_fr:"Test de moins en moins utilisé, remplacé par des tests d'agrégation plaquettaire.",
  note_ar:"فحص أقل استخداماً حالياً، استُبدل باختبارات تكتل الصفائح." },

{ id:102, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'Antithrombine III', name_ar:'مضاد الثرومبين III',
  summary_fr:"Explore les thromboses inexpliquées et récidivantes.",
  summary_ar:"يفحص الجلطات غير المفسرة والمتكررة.",
  prep_fr:["Aucun jeûne nécessaire.","À distance d'un épisode de thrombose aiguë (plusieurs semaines) pour interprétation fiable."],
  prep_ar:["لا حاجة للصيام.","بعيداً عن نوبة جلطة حادة (عدة أسابيع) للحصول على تفسير موثوق."],
  sampling_fr:["Prélèvement veineux, tube citraté."],
  sampling_ar:["أخذ عينة وريدية، أنبوب سيترات."],
  meds_fr:["Signaler impérativement anticoagulants (héparine, AVK) — faussent fortement le résultat."],
  meds_ar:["إبلاغ إلزامياً عن مضادات التخثر — تؤثر بشدة على النتيجة."],
  note_fr:"Doit être réalisé à distance de tout épisode aigu et sans anticoagulant si possible.",
  note_ar:"يجب إجراؤه بعيداً عن أي نوبة حادة ودون مضاد تخثر إن أمكن." },

{ id:103, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'Protéine C et Protéine S', name_ar:'البروتين C والبروتين S',
  summary_fr:"Bilan de thrombophilie, recherche de cause génétique de thrombose.",
  summary_ar:"فحص التخثر الوراثي، البحث عن سبب جيني للجلطة.",
  prep_fr:["Aucun jeûne nécessaire.","À distance d'un épisode thrombotique aigu."],
  prep_ar:["لا حاجة للصيام.","بعيداً عن نوبة جلطة حادة."],
  sampling_fr:["Prélèvement veineux, tube citraté."],
  sampling_ar:["أخذ عينة وريدية، أنبوب سيترات."],
  meds_fr:["Signaler impérativement AVK (Sintrom) — diminue faussement la protéine C/S."],
  meds_ar:["إبلاغ إلزامياً عن مضادات فيتامين ك — تخفض البروتين بشكل خاطئ."],
  note_fr:"Ne jamais réaliser sous traitement AVK sans avis spécialisé — résultats ininterprétables.",
  note_ar:"لا يجب إجراؤه أبداً تحت علاج مضاد فيتامين ك دون رأي متخصص." },

/* ── BACTÉRIOLOGIE — SUITE ──────────────────────────────────── */
{ id:104, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement auriculaire (otite)', name_ar:'مسحة الأذن',
  summary_fr:"Identification bactérienne en cas d'otite compliquée ou récidivante.",
  summary_ar:"تحديد الجرثومة في حالة التهاب أذن معقد أو متكرر.",
  prep_fr:["Ne pas utiliser de gouttes auriculaires 48h avant le prélèvement.","Ne pas nettoyer l'oreille juste avant le test."],
  prep_ar:["عدم استخدام قطرات الأذن قبل 48 ساعة.","عدم تنظيف الأذن قبل الفحص مباشرة."],
  sampling_fr:["Écouvillonnage réalisé par le médecin ORL ou technicien qualifié."],
  sampling_ar:["يقوم طبيب الأنف والأذن والحنجرة أو فني مؤهل بأخذ المسحة."],
  meds_fr:["Signaler tout traitement antibiotique local ou systémique en cours."],
  meds_ar:["إبلاغ عن أي علاج مضاد حيوي موضعي أو جهازي جارٍ."],
  note_fr:"Généralement réservé aux otites chroniques ou ne répondant pas au traitement initial.",
  note_ar:"يُخصص عادة لالتهابات الأذن المزمنة أو التي لا تستجيب للعلاج الأولي." },

{ id:105, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement oculaire (conjonctivite)', name_ar:'مسحة العين',
  summary_fr:"Identifie la cause bactérienne d'une conjonctivite persistante.",
  summary_ar:"يحدد السبب الجرثومي لالتهاب الملتحمة المستمر.",
  prep_fr:["Ne pas appliquer de collyre antibiotique avant le prélèvement.","Ne pas se maquiller les yeux le jour du test."],
  prep_ar:["عدم وضع قطرة مضاد حيوي قبل أخذ العينة.","عدم وضع مكياج العين يوم الفحص."],
  sampling_fr:["Écouvillonnage doux du cul-de-sac conjonctival par le personnel médical."],
  sampling_ar:["مسح لطيف لجيب الملتحمة من قبل الطاقم الطبي."],
  meds_fr:["Signaler tout collyre antibiotique utilisé récemment."],
  meds_ar:["إبلاغ عن أي قطرة مضاد حيوي استُخدمت مؤخراً."],
  note_fr:"Particulièrement important chez le nouveau-né (conjonctivite néonatale).",
  note_ar:"مهم بشكل خاص عند حديثي الولادة." },

{ id:106, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement urétral (homme)', name_ar:'مسحة الإحليل (رجل)',
  summary_fr:"Recherche d'infection sexuellement transmissible (gonocoque, chlamydia).",
  summary_ar:"البحث عن عدوى منقولة جنسياً (السيلان، الكلاميديا).",
  prep_fr:["Ne pas uriner pendant au moins 2 heures avant le prélèvement.","Éviter toilette intime juste avant le test.","Ne pas être sous antibiotique."],
  prep_ar:["عدم التبول لمدة ساعتين على الأقل قبل أخذ العينة.","تجنب النظافة الحميمة قبل الفحص مباشرة.","عدم تناول مضادات حيوية."],
  sampling_fr:["Prélèvement réalisé par écouvillon fin introduit dans l'urètre par le médecin."],
  sampling_ar:["يُجرى أخذ العينة بمسحة رفيعة تُدخل في الإحليل من قبل الطبيب."],
  meds_fr:["Signaler impérativement tout traitement antibiotique récent."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج حديث بالمضادات الحيوية."],
  note_fr:"Ne pas uriner avant le test est essentiel — l'urine élimine les bactéries recherchées.",
  note_ar:"عدم التبول قبل الفحص ضروري — البول يزيل الجراثيم المطلوب الكشف عنها." },

{ id:107, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche d\'Helicobacter pylori (selles)', name_ar:'البحث عن جرثومة المعدة (براز)',
  summary_fr:"Test antigénique non-invasif pour la bactérie responsable d'ulcères gastriques.",
  summary_ar:"فحص غير جراحي للجرثومة المسؤولة عن قرحة المعدة.",
  prep_fr:["Arrêter les inhibiteurs de la pompe à protons (IPP) 2 semaines avant.","Arrêter les antibiotiques 4 semaines avant.","Aucun jeûne nécessaire pour le prélèvement de selles."],
  prep_ar:["التوقف عن مثبطات مضخة البروتون قبل أسبوعين.","التوقف عن المضادات الحيوية قبل 4 أسابيع.","لا حاجة للصيام لأخذ عينة البراز."],
  sampling_fr:["Recueillir un échantillon de selles fraîches dans le pot stérile."],
  sampling_ar:["جمع عينة براز طازجة في الوعاء المعقم."],
  meds_fr:["ESSENTIEL : signaler et arrêter IPP et antibiotiques selon délai indiqué — sinon faux négatif garanti."],
  meds_ar:["ضروري: إبلاغ ووقف مثبطات مضخة البروتون والمضادات الحيوية حسب المدة المحددة — وإلا نتيجة سلبية خاطئة مضمونة."],
  note_fr:"Le non-respect de l'arrêt des IPP est la cause n°1 de faux négatifs pour ce test.",
  note_ar:"عدم احترام وقف مثبطات مضخة البروتون هو السبب الأول للنتائج السلبية الخاطئة." },

{ id:108, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement cutané (mycose)', name_ar:'مسحة جلدية (فطريات)',
  summary_fr:"Recherche de champignons responsables de mycoses cutanées.",
  summary_ar:"البحث عن الفطريات المسؤولة عن الفطريات الجلدية.",
  prep_fr:["Ne pas appliquer de crème antifongique 2 semaines avant le prélèvement.","Ne pas se laver la zone concernée le jour du test."],
  prep_ar:["عدم وضع كريم مضاد للفطريات قبل أسبوعين من الفحص.","عدم غسل المنطقة المعنية يوم الفحص."],
  sampling_fr:["Grattage cutané ou prélèvement de squames par le dermatologue."],
  sampling_ar:["كشط الجلد أو أخذ عينة من القشور من قبل طبيب الجلدية."],
  meds_fr:["Signaler tout traitement antifongique local ou oral récent."],
  meds_ar:["إبلاغ عن أي علاج مضاد للفطريات موضعي أو فموي حديث."],
  note_fr:"L'arrêt du traitement antifongique avant le test est indispensable pour la culture.",
  note_ar:"وقف العلاج المضاد للفطريات قبل الفحص ضروري للزرع." },

/* ── UROLOGIE — SUITE ──────────────────────────────────────── */
{ id:109, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Compte d\'Addis (HLM)', name_ar:'اختبار عد الخلايا في البول',
  summary_fr:"Quantifie les globules rouges/blancs dans les urines sur un temps précis.",
  summary_ar:"يقيس كريات الدم الحمراء/البيضاء في البول خلال وقت محدد.",
  prep_fr:["Vider la vessie à une heure précise (ex: 8h) sans recueillir.","Boire un grand verre d'eau puis ne plus uriner pendant 3 heures.","Recueillir toutes les urines exactement 3 heures plus tard."],
  prep_ar:["إفراغ المثانة في وقت محدد (مثلاً 8 صباحاً) دون جمع البول.","شرب كوب كبير من الماء ثم عدم التبول لمدة 3 ساعات.","جمع كل البول بعد 3 ساعات بالضبط."],
  sampling_fr:["Recueillir la totalité des urines dans le pot fourni, en respectant l'horaire strict."],
  sampling_ar:["جمع كل البول في الوعاء المقدم، مع احترام التوقيت الصارم."],
  meds_fr:["Signaler tout traitement diurétique en cours."],
  meds_ar:["إبلاغ عن أي علاج مدر للبول جارٍ."],
  note_fr:"Le respect strict des 3 heures est essentiel pour un résultat interprétable.",
  note_ar:"احترام الساعات الثلاث بدقة ضروري للحصول على نتيجة قابلة للتفسير." },

{ id:110, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche de BK dans les urines', name_ar:'البحث عن عصية كوخ في البول',
  summary_fr:"Dépistage de la tuberculose urogénitale.",
  summary_ar:"الكشف عن السل البولي التناسلي.",
  prep_fr:["Recueillir les urines totales du matin (premier jet complet, pas seulement le milieu du jet).","Recueil sur 3 jours consécutifs recommandé."],
  prep_ar:["جمع كل بول الصباح (الدفعة الكاملة الأولى، وليس فقط المنتصف).","يُنصح بالجمع على 3 أيام متتالية."],
  sampling_fr:["Recueillir la totalité de la première miction du matin dans le pot stérile."],
  sampling_ar:["جمع كامل أول تبول صباحي في الوعاء المعقم."],
  meds_fr:["Signaler tout traitement antituberculeux déjà commencé."],
  meds_ar:["إبلاغ عن أي علاج مضاد للسل بدأ بالفعل."],
  note_fr:"Contrairement à l'ECBU classique, on recueille ICI la totalité de la miction, pas seulement le milieu du jet.",
  note_ar:"على عكس فحص البول العادي، هنا يُجمع كامل التبول وليس فقط المنتصف." },

{ id:111, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche de sucre et corps cétoniques (bandelette urinaire)', name_ar:'شريط اختبار البول (السكر والأجسام الكيتونية)',
  summary_fr:"Test rapide de dépistage, utile chez le diabétique et la femme enceinte.",
  summary_ar:"فحص سريع للكشف، مفيد عند مرضى السكري والحوامل.",
  prep_fr:["Aucune préparation particulière.","Prélèvement à tout moment de la journée."],
  prep_ar:["لا تحضير خاص.","أخذ العينة في أي وقت من اليوم."],
  sampling_fr:["Recueillir un échantillon d'urine simple, tremper la bandelette immédiatement."],
  sampling_ar:["جمع عينة بول بسيطة، غمس الشريط فوراً."],
  meds_fr:["Signaler traitement antidiabétique en cours."],
  meds_ar:["إبلاغ عن علاج السكري الجاري."],
  note_fr:"Résultat immédiat en 1-2 minutes, réalisable en cabinet médical.",
  note_ar:"نتيجة فورية خلال 1-2 دقيقة، يمكن إجراؤها في العيادة الطبية." },

{ id:112, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Spermoculture', name_ar:'زرع السائل المنوي',
  summary_fr:"Recherche d'infection dans le sperme, en cas d'infertilité ou de douleur.",
  summary_ar:"البحث عن عدوى في السائل المنوي، في حالة العقم أو الألم.",
  prep_fr:["Abstinence sexuelle de 3 à 5 jours avant le prélèvement.","Toilette intime rigoureuse avant recueil.","Ne pas être sous antibiotique."],
  prep_ar:["الامتناع الجنسي من 3 إلى 5 أيام قبل الفحص.","نظافة حميمة دقيقة قبل الجمع.","عدم تناول مضادات حيوية."],
  sampling_fr:["Recueil par masturbation dans un pot stérile, au laboratoire ou à domicile (transport rapide <1h)."],
  sampling_ar:["الجمع بالاستمناء في وعاء معقم، في المخبر أو المنزل (نقل سريع أقل من ساعة)."],
  meds_fr:["Signaler tout traitement antibiotique récent."],
  meds_ar:["إبلاغ عن أي علاج حديث بالمضادات الحيوية."],
  note_fr:"Le respect du délai d'abstinence est essentiel pour un résultat fiable.",
  note_ar:"احترام مدة الامتناع ضروري للحصول على نتيجة موثوقة." },

{ id:113, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Spermogramme', name_ar:'تحليل السائل المنوي',
  summary_fr:"Analyse complète de la qualité du sperme, bilan de fertilité masculine.",
  summary_ar:"تحليل شامل لجودة السائل المنوي، فحص الخصوبة عند الرجل.",
  prep_fr:["Abstinence sexuelle de 3 à 5 jours (ni plus, ni moins).","Éviter fièvre ou maladie dans les 3 mois précédents (fausse le résultat).","Éviter bains chauds/sauna prolongés avant le test."],
  prep_ar:["الامتناع الجنسي من 3 إلى 5 أيام (لا أكثر ولا أقل).","تجنب الحمى أو المرض خلال 3 أشهر سابقة (يؤثر على النتيجة).","تجنب الحمامات الساخنة/الساونا لفترة طويلة قبل الفحص."],
  sampling_fr:["Recueil par masturbation, idéalement directement au laboratoire.","Si à domicile : transport en moins de 30-45 minutes à température corporelle."],
  sampling_ar:["الجمع بالاستمناء، يفضل مباشرة في المخبر.","إذا كان في المنزل: النقل خلال 30-45 دقيقة بدرجة حرارة الجسم."],
  meds_fr:["Signaler tout traitement récent, notamment anabolisants ou chimiothérapie."],
  meds_ar:["إبلاغ عن أي علاج حديث، خاصة المنشطات أو العلاج الكيميائي."],
  note_fr:"Un épisode fébrile dans les 3 mois précédents peut fortement altérer temporairement les résultats.",
  note_ar:"نوبة حمى خلال 3 أشهر سابقة قد تغير النتائج مؤقتاً بشكل كبير." },


/* ── HORMONOLOGIE — SUITE ─────────────────────────────────── */
{ id:114, cat:'hormonologie', fasting:8, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Peptide C', name_ar:'الببتيد C',
  summary_fr:"Évalue la sécrétion résiduelle d'insuline par le pancréas.",
  summary_ar:"يقيّم إفراز الأنسولين المتبقي من البنكرياس.",
  prep_fr:["Jeûne strict de 8 heures.","Réalisé souvent avec la glycémie à jeun."],
  prep_ar:["صيام صارم لمدة 8 ساعات.","غالباً يُجرى مع فحص السكر على الريق."],
  sampling_fr:["Prélèvement veineux le matin à jeun."],
  sampling_ar:["أخذ عينة وريدية صباحاً على الريق."],
  meds_fr:["Signaler traitement par insuline injectée (fausse l'interprétation)."],
  meds_ar:["إبلاغ عن علاج الأنسولين المحقون (يؤثر على التفسير)."],
  note_fr:"Utile pour différencier diabète type 1 et type 2 en cas de doute.",
  note_ar:"مفيد للتمييز بين السكري من النوع 1 والنوع 2 عند الشك." },

{ id:115, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-TPO (thyroïde)', name_ar:'الأجسام المضادة لبيروكسيداز الدرقية',
  summary_fr:"Dépistage de la thyroïdite auto-immune (Hashimoto).",
  summary_ar:"الكشف عن التهاب الغدة الدرقية المناعي الذاتي.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement thyroïdien en cours."],
  meds_ar:["إبلاغ عن علاج الغدة الدرقية الجاري."],
  note_fr:"Souvent demandé conjointement avec la TSH en cas d'hypothyroïdie.",
  note_ar:"غالباً يُطلب مع TSH في حالة قصور الغدة الدرقية." },

{ id:116, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'SHBG (Globuline liant les hormones sexuelles)', name_ar:'بروتين ربط الهرمونات الجنسية',
  summary_fr:"Complète le bilan d'hyperandrogénie chez la femme.",
  summary_ar:"يكمل فحص فرط الأندروجين عند المرأة.",
  prep_fr:["Aucun jeûne nécessaire.","Prélèvement matinal recommandé."],
  prep_ar:["لا حاجة للصيام.","يُنصح بأخذ العينة صباحاً."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler contraceptifs oraux (augmentent le taux)."],
  meds_ar:["إبلاغ عن حبوب منع الحمل (ترفع المعدل)."],
  note_fr:"Utile dans le bilan du syndrome des ovaires polykystiques (SOPK).",
  note_ar:"مفيد في فحص متلازمة تكيس المبايض." },

{ id:117, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'17-OH Progestérone', name_ar:'17-OH بروجسترون',
  summary_fr:"Dépistage de l'hyperplasie congénitale des surrénales.",
  summary_ar:"الكشف عن فرط تنسج الغدة الكظرية الخلقي.",
  prep_fr:["Prélèvement le matin (pic circadien).","Chez la femme : idéalement en début de cycle."],
  prep_ar:["أخذ العينة صباحاً (ذروة الساعة البيولوجية).","عند المرأة: يفضل بداية الدورة."],
  sampling_fr:["Prélèvement veineux le matin."],
  sampling_ar:["أخذ عينة وريدية صباحاً."],
  meds_fr:["Signaler corticothérapie en cours."],
  meds_ar:["إبلاغ عن العلاج بالكورتيزون الجاري."],
  note_fr:"Test de dépistage néonatal systématique dans certains pays pour l'hyperplasie surrénalienne.",
  note_ar:"فحص كشف منتظم عند حديثي الولادة في بعض الدول لفرط تنسج الكظرية." },

{ id:118, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'DHEA-S (Déhydroépiandrostérone)', name_ar:'DHEA-S',
  summary_fr:"Hormone surrénalienne, explore l'hyperandrogénie.",
  summary_ar:"هرمون كظري، يفحص فرط الأندروجين.",
  prep_fr:["Aucun jeûne nécessaire.","Prélèvement matinal recommandé."],
  prep_ar:["لا حاجة للصيام.","يُنصح بأخذ العينة صباحاً."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler corticoïdes et contraceptifs oraux."],
  meds_ar:["إبلاغ عن الكورتيزون وحبوب منع الحمل."],
  note_fr:"Diminue naturellement avec l'âge après 30 ans.",
  note_ar:"ينخفض طبيعياً مع التقدم في السن بعد الثلاثين." },

{ id:119, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'ACTH (Hormone corticotrope)', name_ar:'هرمون ACTH',
  summary_fr:"Explore l'axe hypothalamo-hypophyso-surrénalien.",
  summary_ar:"يفحص محور الوطاء-النخامية-الكظرية.",
  prep_fr:["Prélèvement le matin entre 7h-9h, tube glacé, transport rapide (hormone instable).","Jeûne de 8h recommandé.","Repos avant prélèvement (stress augmente l'ACTH)."],
  prep_ar:["أخذ العينة صباحاً بين 7-9، أنبوب مبرد، نقل سريع (هرمون غير مستقر).","يُنصح بصيام 8 ساعات.","الراحة قبل أخذ العينة (التوتر يرفع ACTH)."],
  sampling_fr:["Prélèvement veineux le matin, transport immédiat sur glace au laboratoire."],
  sampling_ar:["أخذ عينة وريدية صباحاً، نقل فوري على الثلج إلى المخبر."],
  meds_fr:["Signaler impérativement corticothérapie en cours (même minime)."],
  meds_ar:["إبلاغ إلزامياً عن العلاج بالكورتيزون الجاري (حتى البسيط)."],
  note_fr:"Test techniquement délicat — nécessite transport rapide réfrigéré au laboratoire.",
  note_ar:"فحص دقيق تقنياً — يتطلب نقلاً سريعاً ومبرداً إلى المخبر." },

{ id:120, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'GH (Hormone de croissance)', name_ar:'هرمون النمو',
  summary_fr:"Explore les troubles de croissance chez l'enfant.",
  summary_ar:"يفحص اضطرابات النمو عند الأطفال.",
  prep_fr:["Jeûne strict de 8h.","Repos physique et psychique avant le test (le stress et l'effort augmentent la GH)."],
  prep_ar:["صيام صارم لمدة 8 ساعات.","الراحة الجسدية والنفسية قبل الفحص (التوتر والمجهود يرفعان الهرمون)."],
  sampling_fr:["Prélèvement veineux le matin, parfois répété (test dynamique)."],
  sampling_ar:["أخذ عينة وريدية صباحاً، أحياناً تُكرر (فحص ديناميكي)."],
  meds_fr:["Signaler tout traitement par hormone de croissance en cours."],
  meds_ar:["إبلاغ عن أي علاج بهرمون النمو جارٍ."],
  note_fr:"Souvent réalisé en test dynamique (avec stimulation) en milieu hospitalier pédiatrique.",
  note_ar:"غالباً يُجرى كفحص ديناميكي (مع تحفيز) في وسط استشفائي للأطفال." },

{ id:121, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'IGF-1 (Somatomédine C)', name_ar:'IGF-1',
  summary_fr:"Reflet indirect et stable de la sécrétion de l'hormone de croissance.",
  summary_ar:"انعكاس غير مباشر ومستقر لإفراز هرمون النمو.",
  prep_fr:["Aucun jeûne strict, mais recommandé.","Aucune préparation particulière."],
  prep_ar:["لا صيام صارم، لكن يُنصح به.","لا تحضير خاص."],
  sampling_fr:["Prélèvement veineux simple, à tout moment (contrairement à la GH)."],
  sampling_ar:["أخذ عينة وريدية بسيطة، في أي وقت."],
  meds_fr:["Signaler traitement par hormone de croissance."],
  meds_ar:["إبلاغ عن علاج هرمون النمو."],
  note_fr:"Plus stable que la GH dans la journée, plus facile à interpréter.",
  note_ar:"أكثر استقراراً من هرمون النمو خلال اليوم، أسهل في التفسير." },

/* ── BIOCHIMIE PÉDIATRIQUE / MÉTABOLIQUE ────────────────────── */
{ id:122, cat:'biochimie', fasting:0, tubes:[{c:'#fca5a5',n_fr:'Papier buvard (talon)',n_ar:'ورق ماص (كعب القدم)'}],
  name_fr:'Dépistage néonatal (Guthrie)', name_ar:'فحص كشف حديثي الولادة',
  summary_fr:"Dépistage systématique de maladies métaboliques chez le nouveau-né.",
  summary_ar:"كشف منتظم للأمراض الاستقلابية عند حديثي الولادة.",
  prep_fr:["Réalisé entre le 3e et le 5e jour de vie du nouveau-né.","Bébé doit avoir été alimenté au moins 24h avant (pas à jeun)."],
  prep_ar:["يُجرى بين اليوم الثالث والخامس من عمر المولود.","يجب أن يكون الرضيع قد تغذى منذ 24 ساعة على الأقل."],
  sampling_fr:["Piqûre au talon du bébé, quelques gouttes de sang déposées sur papier buvard spécial."],
  sampling_ar:["وخز في كعب قدم الرضيع، بضع قطرات دم على ورق ماص خاص."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Test essentiel et gratuit, permet de dépister précocement des maladies graves mais traitables.",
  note_ar:"فحص أساسي ومجاني، يسمح بالكشف المبكر عن أمراض خطيرة لكن قابلة للعلاج." },

{ id:123, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan thyroïdien néonatal (TSH néonatale)', name_ar:'فحص الغدة الدرقية عند حديثي الولادة',
  summary_fr:"Dépistage systématique de l'hypothyroïdie congénitale.",
  summary_ar:"كشف منتظم لقصور الغدة الدرقية الخلقي.",
  prep_fr:["Réalisé systématiquement chez tout nouveau-né en Algérie.","Aucun jeûne nécessaire."],
  prep_ar:["يُجرى بشكل منتظم لكل مولود في الجزائر.","لا حاجة للصيام."],
  sampling_fr:["Piqûre au talon, quelques jours après la naissance."],
  sampling_ar:["وخز في كعب القدم، بعد بضعة أيام من الولادة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Dépistage crucial car l'hypothyroïdie congénitale non traitée cause un retard mental irréversible.",
  note_ar:"كشف حاسم لأن قصور الغدة الدرقية الخلقي غير المعالج يسبب تأخراً عقلياً لا رجعة فيه." },

/* ── PARASITOLOGIE — SUITE ─────────────────────────────────── */
{ id:124, cat:'parasitologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche d\'Entamoeba histolytica', name_ar:'البحث عن الأميبا الحالة للنسج',
  summary_fr:"Recherche d'amibiase intestinale, cause de dysenterie.",
  summary_ar:"البحث عن داء الأميبا المعوي، سبب الزحار.",
  prep_fr:["Selles fraîches (moins de 30 minutes) — le parasite se dégrade vite.","Ne pas prendre d'antiparasitaire avant."],
  prep_ar:["براز طازج (أقل من 30 دقيقة) — الطفيلي يتحلل بسرعة.","عدم تناول مضاد للطفيليات قبل الفحص."],
  sampling_fr:["Recueillir un échantillon encore chaud, apporter IMMÉDIATEMENT au laboratoire."],
  sampling_ar:["جمع عينة لا تزال دافئة، إحضارها فوراً إلى المخبر."],
  meds_fr:["Signaler traitement antiparasitaire récent."],
  meds_ar:["إبلاغ عن علاج مضاد للطفيليات حديث."],
  note_fr:"L'amibe se dégrade en quelques minutes — le délai de transport est critique pour ce test.",
  note_ar:"الأميبا تتحلل خلال دقائق — مدة النقل حاسمة لهذا الفحص." },

{ id:125, cat:'parasitologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Leishmaniose', name_ar:'فحص داء الليشمانيات',
  summary_fr:"Dépistage de la leishmaniose, transmise par piqûre de phlébotome.",
  summary_ar:"الكشف عن داء الليشمانيات، ينتقل بلدغة ذبابة الرمل.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler tout séjour en zone rurale ou saharienne."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن أي إقامة في منطقة ريفية أو صحراوية."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Maladie présente dans plusieurs régions d'Algérie, notamment le Sud et les Hauts Plateaux.",
  note_ar:"مرض موجود في عدة مناطق بالجزائر، خاصة الجنوب والهضاب العليا." },

{ id:126, cat:'parasitologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Bilharziose (Schistosomiase)', name_ar:'فحص داء البلهارسيا',
  summary_fr:"Dépistage chez les personnes ayant voyagé en zone d'endémie.",
  summary_ar:"الكشف عند الأشخاص الذين سافروا لمناطق موبوءة.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler tout contact avec de l'eau douce en zone tropicale/subsaharienne."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن أي تلامس مع مياه عذبة في منطقة استوائية."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Rarement autochtone en Algérie — surtout dépistée chez les voyageurs revenant d'Afrique subsaharienne.",
  note_ar:"نادراً ما يكون محلياً في الجزائر — يُكشف خاصة عند المسافرين العائدين من أفريقيا جنوب الصحراء." },

{ id:127, cat:'parasitologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche de Cryptosporidium', name_ar:'البحث عن الكريبتوسبوريديوم',
  summary_fr:"Parasite responsable de diarrhée sévère, surtout chez l'immunodéprimé.",
  summary_ar:"طفيلي يسبب إسهالاً شديداً، خاصة عند ضعاف المناعة.",
  prep_fr:["Recueillir des selles fraîches.","Ne pas prendre d'antidiarrhéique avant le test."],
  prep_ar:["جمع براز طازج.","عدم تناول مضاد للإسهال قبل الفحص."],
  sampling_fr:["Recueillir dans le pot stérile fourni par le laboratoire."],
  sampling_ar:["الجمع في الوعاء المعقم المقدم من المخبر."],
  meds_fr:["Signaler statut immunitaire (VIH, chimiothérapie, immunosuppresseurs)."],
  meds_ar:["إبلاغ عن الحالة المناعية (إيدز، علاج كيميائي، مثبطات مناعة)."],
  note_fr:"Nécessite une technique de coloration spéciale, à signaler au laboratoire si suspecté.",
  note_ar:"يتطلب تقنية تلوين خاصة، يجب إبلاغ المخبر عند الاشتباه." },

/* ── SÉROLOGIE — SUITE ─────────────────────────────────────── */
{ id:128, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie EBV (Mononucléose infectieuse)', name_ar:'فحص داء وحيدات النوى المعدي',
  summary_fr:"Dépistage de la mononucléose, maladie du baiser.",
  summary_ar:"الكشف عن داء وحيدات النوى، مرض القبلة.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Fréquente chez l'adolescent et le jeune adulte, se manifeste par fatigue et angine.",
  note_ar:"شائع عند المراهقين والشباب، يظهر بالتعب والتهاب الحلق." },

{ id:129, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Coqueluche', name_ar:'فحص السعال الديكي',
  summary_fr:"Dépistage de l'infection à Bordetella pertussis.",
  summary_ar:"الكشف عن عدوى بورديتيلا الشاهوقية.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler date des derniers vaccins contre la coqueluche."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن تاريخ آخر تطعيمات ضد السعال الديكي."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler antibiothérapie récente."],
  meds_ar:["إبلاغ عن علاج حديث بالمضادات الحيوية."],
  note_fr:"Particulièrement dangereuse chez le nourrisson non complètement vacciné.",
  note_ar:"خطيرة بشكل خاص عند الرضع غير المطعمين بالكامل." },

{ id:130, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Chlamydia trachomatis', name_ar:'فحص الكلاميديا',
  summary_fr:"Dépistage d'infection sexuellement transmissible fréquente.",
  summary_ar:"الكشف عن عدوى منقولة جنسياً شائعة.",
  prep_fr:["Aucun jeûne nécessaire.","Test complémentaire au prélèvement local (PCR)."],
  prep_ar:["لا حاجة للصيام.","فحص مكمل للمسحة الموضعية (PCR)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler tout traitement antibiotique récent."],
  meds_ar:["إبلاغ عن أي علاج حديث بالمضادات الحيوية."],
  note_fr:"Le diagnostic de certitude passe surtout par la PCR sur prélèvement local.",
  note_ar:"التشخيص الأكيد يمر خاصة عبر PCR على عينة موضعية." },

{ id:131, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon/urine',n_ar:'مسحة/بول'}],
  name_fr:'PCR Chlamydia/Gonocoque', name_ar:'PCR الكلاميديا/السيلان',
  summary_fr:"Test moléculaire très sensible pour IST, sur urine ou écouvillon.",
  summary_ar:"فحص جزيئي حساس جداً للأمراض المنقولة جنسياً.",
  prep_fr:["Ne pas uriner 2h avant si prélèvement urinaire.","Éviter toilette intime avant si écouvillon."],
  prep_ar:["عدم التبول لمدة ساعتين قبل الفحص إذا كانت العينة بولية.","تجنب النظافة الحميمة قبل الفحص إذا كانت مسحة."],
  sampling_fr:["Premier jet d'urine ou écouvillon vaginal/urétral selon prescription."],
  sampling_ar:["أول دفعة بول أو مسحة مهبلية/إحليلية حسب الوصفة."],
  meds_fr:["Signaler tout traitement antibiotique récent."],
  meds_ar:["إبلاغ عن أي علاج حديث بالمضادات الحيوية."],
  note_fr:"Test très sensible, résultat généralement disponible en 24-48h.",
  note_ar:"فحص حساس جداً، النتيجة متوفرة عادة خلال 24-48 ساعة." },

/* ── IMMUNOLOGIE — SUITE ───────────────────────────────────── */
{ id:132, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-DNA natif', name_ar:'الأجسام المضادة للحمض النووي',
  summary_fr:"Marqueur spécifique du lupus érythémateux systémique.",
  summary_ar:"مؤشر خاص بالذئبة الحمامية الجهازية.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement immunosuppresseur."],
  meds_ar:["إبلاغ عن علاج مثبط للمناعة."],
  note_fr:"Utile pour le suivi de l'activité du lupus (corrélé aux poussées).",
  note_ar:"مفيد لمتابعة نشاط الذئبة." },

{ id:133, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-thyroglobuline', name_ar:'الأجسام المضادة للغلوبيولين الدرقي',
  summary_fr:"Complète le bilan de thyroïdite auto-immune.",
  summary_ar:"يكمل فحص التهاب الغدة الدرقية المناعي.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement thyroïdien en cours."],
  meds_ar:["إبلاغ عن علاج الغدة الدرقية الجاري."],
  note_fr:"Souvent associée aux anticorps anti-TPO dans le bilan thyroïdien auto-immun.",
  note_ar:"غالباً ترتبط بالأجسام المضادة لـTPO في فحص الغدة المناعي." },

{ id:134, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-gliadine / anti-transglutaminase', name_ar:'الأجسام المضادة للغلوتين',
  summary_fr:"Dépistage de la maladie cœliaque (intolérance au gluten).",
  summary_ar:"الكشف عن الداء الزلاقي (عدم تحمل الغلوتين).",
  prep_fr:["IMPORTANT : le patient doit consommer du gluten normalement avant le test.","Ne pas arrêter le gluten avant l'analyse (fausse le résultat)."],
  prep_ar:["مهم: يجب على المريض تناول الغلوتين بشكل طبيعي قبل الفحص.","عدم التوقف عن الغلوتين قبل التحليل (يؤثر على النتيجة)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Un régime sans gluten débuté avant le test fausse totalement le résultat — attendre le diagnostic avant d'exclure le gluten.",
  note_ar:"النظام الخالي من الغلوتين قبل الفحص يشوه النتيجة تماماً — يجب انتظار التشخيص قبل استبعاد الغلوتين." },

{ id:135, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-mitochondries', name_ar:'الأجسام المضادة للميتوكوندريا',
  summary_fr:"Dépistage de la cirrhose biliaire primitive.",
  summary_ar:"الكشف عن تليف الكبد الصفراوي الأولي.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement hépatique en cours."],
  meds_ar:["إبلاغ عن علاج الكبد الجاري."],
  note_fr:"Souvent demandé en cas de cholestase inexpliquée (élévation isolée des PAL/GGT).",
  note_ar:"غالباً يُطلب في حالة ركود صفراوي غير مفسر." },

/* ── BACTÉRIOLOGIE / SANTÉ PUBLIQUE — SUITE ─────────────────── */
{ id:136, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon rectal',n_ar:'مسحة شرجية'}],
  name_fr:'Portage de bactéries multirésistantes (BMR)', name_ar:'حمل الجراثيم المقاومة',
  summary_fr:"Dépistage avant hospitalisation, notamment en réanimation.",
  summary_ar:"الكشف قبل دخول المستشفى، خاصة في العناية المركزة.",
  prep_fr:["Aucune préparation particulière.","Souvent demandé systématiquement à l'admission hospitalière."],
  prep_ar:["لا تحضير خاص.","غالباً يُطلب بشكل منتظم عند دخول المستشفى."],
  sampling_fr:["Écouvillonnage rectal réalisé par le personnel soignant."],
  sampling_ar:["مسح شرجي يقوم به الطاقم الطبي."],
  meds_fr:["Signaler hospitalisations et antibiothérapies récentes (6 derniers mois)."],
  meds_ar:["إبلاغ عن أي دخول للمستشفى أو علاج بالمضادات الحيوية خلال 6 أشهر سابقة."],
  note_fr:"Mesure de prévention essentielle pour limiter la propagation des bactéries résistantes en milieu hospitalier.",
  note_ar:"إجراء وقائي أساسي للحد من انتشار الجراثيم المقاومة في الوسط الاستشفائي." },

{ id:137, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement de cathéter (extrémité)', name_ar:'مسحة نهاية القسطرة',
  summary_fr:"Recherche d'infection sur cathéter veineux, réalisée en milieu hospitalier.",
  summary_ar:"البحث عن عدوى على القسطرة الوريدية، تُجرى في وسط استشفائي.",
  prep_fr:["Réalisé uniquement par le personnel médical lors du retrait du cathéter.","Aucune préparation par le patient."],
  prep_ar:["يُجرى فقط من قبل الطاقم الطبي عند سحب القسطرة.","لا تحضير من قبل المريض."],
  sampling_fr:["L'extrémité du cathéter retiré est directement envoyée en culture."],
  sampling_ar:["نهاية القسطرة المسحوبة تُرسل مباشرة للزرع."],
  meds_fr:["Signaler antibiothérapie en cours."],
  meds_ar:["إبلاغ عن العلاج الجاري بالمضادات الحيوية."],
  note_fr:"Examen exclusivement hospitalier, sans action requise du patient.",
  note_ar:"فحص استشفائي حصري، لا يتطلب إجراءً من المريض." },

/* ── BIOCHIMIE — TESTS FONCTIONNELS ────────────────────────── */
{ id:138, cat:'biochimie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Sachet respiratoire',n_ar:'كيس تنفسي'}],
  name_fr:'Test respiratoire à l\'urée (Helicobacter pylori)', name_ar:'اختبار التنفس لليوريا',
  summary_fr:"Test non invasif de dépistage d'Helicobacter pylori par l'haleine.",
  summary_ar:"فحص غير جراحي للكشف عن جرثومة المعدة عبر النفس.",
  prep_fr:["Jeûne strict de 6 heures avant le test.","Arrêter les IPP 2 semaines avant.","Arrêter les antibiotiques 4 semaines avant.","Ne pas fumer le jour du test."],
  prep_ar:["صيام صارم لمدة 6 ساعات قبل الفحص.","التوقف عن مثبطات مضخة البروتون قبل أسبوعين.","التوقف عن المضادات الحيوية قبل 4 أسابيع.","عدم التدخين يوم الفحص."],
  sampling_fr:["Souffler dans un sachet, boire une solution test, souffler à nouveau après 30 minutes."],
  sampling_ar:["النفخ في كيس، شرب محلول الفحص، النفخ مجدداً بعد 30 دقيقة."],
  meds_fr:["ESSENTIEL : respecter l'arrêt des IPP et antibiotiques selon les délais indiqués."],
  meds_ar:["ضروري: احترام وقف مثبطات مضخة البروتون والمضادات الحيوية حسب المدة المحددة."],
  note_fr:"Test rapide et indolore (30-40 min), alternative fiable à la fibroscopie pour ce dépistage.",
  note_ar:"فحص سريع وغير مؤلم (30-40 دقيقة)، بديل موثوق للمنظار لهذا الكشف." },

{ id:139, cat:'biochimie', fasting:12, tubes:[{c:'#4ade80',n_fr:'Sachet respiratoire',n_ar:'كيس تنفسي'}],
  name_fr:'Test respiratoire à l\'hydrogène (intolérance au lactose)', name_ar:'اختبار التنفس بالهيدروجين',
  summary_fr:"Dépistage de l'intolérance au lactose ou au fructose.",
  summary_ar:"الكشف عن عدم تحمل اللاكتوز أو الفركتوز.",
  prep_fr:["Jeûne strict de 12 heures.","Éviter fibres, légumineuses et pain complet la veille au soir.","Ne pas fumer avant et pendant le test.","Se brosser les dents avant (sans dentifrice sucré)."],
  prep_ar:["صيام صارم لمدة 12 ساعة.","تجنب الألياف والبقوليات والخبز الكامل في مساء اليوم السابق.","عدم التدخين قبل وأثناء الفحص.","تنظيف الأسنان قبل الفحص (دون معجون سكري)."],
  sampling_fr:["Souffler dans l'appareil, boire la solution de lactose, souffler toutes les 30 min pendant 3h."],
  sampling_ar:["النفخ في الجهاز، شرب محلول اللاكتوز، النفخ كل 30 دقيقة لمدة 3 ساعات."],
  meds_fr:["Signaler antibiotiques récents (modifient la flore intestinale testée)."],
  meds_ar:["إبلاغ عن المضادات الحيوية الحديثة (تغير الفلورا المعوية المفحوصة)."],
  note_fr:"Test long (3h) — prévoir de rester au laboratoire pendant toute la durée.",
  note_ar:"فحص طويل (3 ساعات) — يجب البقاء في المخبر طوال المدة." },

/* ── BIOCHIMIE — MARQUEURS TUMORAUX ───────────────────────── */
{ id:140, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'PSA (Antigène Spécifique de la Prostate)', name_ar:'مستضد البروستاتا النوعي PSA',
  summary_fr:"Dépistage et suivi des pathologies prostatiques chez l'homme.",
  summary_ar:"الكشف ومتابعة أمراض البروستاتا عند الرجل.",
  prep_fr:["Éviter éjaculation dans les 48h précédant le test.","Éviter le toucher rectal ou massage prostatique 1 semaine avant.","Éviter le vélo intense la veille."],
  prep_ar:["تجنب القذف خلال 48 ساعة قبل الفحص.","تجنب الفحص الشرجي أو تدليك البروستاتا قبل أسبوع.","تجنب ركوب الدراجة بشكل مكثف في اليوم السابق."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement pour hypertrophie prostatique (finastéride) — diminue faussement le taux."],
  meds_ar:["إبلاغ عن علاج تضخم البروستاتا — يخفض المعدل بشكل خاطئ."],
  note_fr:"Toute manipulation prostatique récente peut fortement élever faussement le résultat.",
  note_ar:"أي تلاعب حديث بالبروستاتا قد يرفع النتيجة بشكل خاطئ وكبير." },

{ id:141, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'CA 125 (marqueur ovarien)', name_ar:'واسم CA 125',
  summary_fr:"Marqueur de suivi, notamment dans le cancer de l'ovaire.",
  summary_ar:"مؤشر متابعة، خاصة في سرطان المبيض.",
  prep_fr:["Aucun jeûne nécessaire.","Éviter la période des règles si possible (peut légèrement l'élever)."],
  prep_ar:["لا حاجة للصيام.","تجنب فترة الدورة الشهرية إن أمكن (قد ترفعه قليلاً)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Peut être élevé dans des situations bénignes (endométriose, règles, grossesse).",
  note_ar:"قد يرتفع في حالات حميدة (بطانة الرحم المهاجرة، الدورة، الحمل)." },

{ id:142, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'CA 19-9 (marqueur digestif)', name_ar:'واسم CA 19-9',
  summary_fr:"Marqueur de suivi des cancers digestifs (pancréas, voies biliaires).",
  summary_ar:"مؤشر متابعة سرطانات الجهاز الهضمي.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Non spécifique — peut être élevé en cas de cholestase bénigne.",
  note_ar:"غير خاص — قد يرتفع في حالة ركود صفراوي حميد." },

{ id:143, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'ACE (Antigène Carcino-Embryonnaire)', name_ar:'المستضد المضغي السرطاني ACE',
  summary_fr:"Marqueur de suivi, notamment cancer colorectal.",
  summary_ar:"مؤشر متابعة، خاصة سرطان القولون والمستقيم.",
  prep_fr:["Aucun jeûne nécessaire.","Arrêter de fumer avant le test si possible (le tabac élève le taux)."],
  prep_ar:["لا حاجة للصيام.","التوقف عن التدخين قبل الفحص إن أمكن (التدخين يرفع المعدل)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Le tabagisme peut à lui seul augmenter légèrement ce marqueur — à signaler.",
  note_ar:"التدخين وحده قد يرفع هذا المؤشر قليلاً — يجب الإبلاغ عنه." },

{ id:144, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Alpha-fœtoprotéine (AFP)', name_ar:'ألفا فيتوبروتين',
  summary_fr:"Marqueur du cancer du foie et dépistage prénatal.",
  summary_ar:"مؤشر سرطان الكبد وفحص ما قبل الولادة.",
  prep_fr:["Aucun jeûne nécessaire.","Chez la femme enceinte : dater précisément le terme de grossesse."],
  prep_ar:["لا حاجة للصيام.","عند الحامل: تحديد عمر الحمل بدقة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Utilisé à la fois en dépistage prénatal (trisomie) et en suivi hépatique — le contexte doit être précisé.",
  note_ar:"يُستخدم في الكشف عن التثلث الصبغي وفي متابعة الكبد — يجب تحديد السياق." },


/* ── BIOCHIMIE — DIVERS COMPLÉMENTAIRES ────────────────────── */
{ id:145, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Zinc sérique', name_ar:'الزنك في الدم',
  summary_fr:"Oligo-élément important pour l'immunité et la cicatrisation.",
  summary_ar:"عنصر نادر مهم للمناعة والشفاء.",
  prep_fr:["Jeûne de 8h recommandé.","Prélèvement le matin, tube spécial sans zinc."],
  prep_ar:["يُنصح بصيام 8 ساعات.","أخذ العينة صباحاً، أنبوب خاص خالٍ من الزنك."],
  sampling_fr:["Prélèvement veineux, éviter contamination par gants en latex (contiennent du zinc)."],
  sampling_ar:["أخذ عينة وريدية، تجنب التلوث بقفازات لاتكس (تحتوي على زنك)."],
  meds_fr:["Signaler suppléments en zinc en cours."],
  meds_ar:["إبلاغ عن مكملات الزنك الجارية."],
  note_fr:"Facilement contaminé par le matériel de prélèvement — technique rigoureuse requise.",
  note_ar:"يتلوث بسهولة بمعدات أخذ العينة — يتطلب تقنية دقيقة." },

{ id:146, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Cuivre sérique (Cuprémie)', name_ar:'النحاس في الدم',
  summary_fr:"Utile dans le dépistage de la maladie de Wilson.",
  summary_ar:"مفيد في الكشف عن داء ويلسون.",
  prep_fr:["Aucun jeûne obligatoire, mais 8h recommandé."],
  prep_ar:["لا صيام إلزامي، لكن يُنصح بـ8 ساعات."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler contraceptifs oraux (augmentent le taux)."],
  meds_ar:["إبلاغ عن حبوب منع الحمل (ترفع المعدل)."],
  note_fr:"Souvent couplé à la céruloplasmine pour le diagnostic de maladie de Wilson.",
  note_ar:"غالباً يُربط مع السيرولوبلازمين لتشخيص داء ويلسون." },

{ id:147, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Céruloplasmine', name_ar:'السيرولوبلازمين',
  summary_fr:"Protéine de transport du cuivre, dépistage de maladie de Wilson.",
  summary_ar:"بروتين نقل النحاس، الكشف عن داء ويلسون.",
  prep_fr:["Jeûne de 8h recommandé."],
  prep_ar:["يُنصح بصيام 8 ساعات."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler contraceptifs oraux et grossesse."],
  meds_ar:["إبلاغ عن حبوب منع الحمل والحمل."],
  note_fr:"Diminuée dans la maladie de Wilson, augmentée en cas d'inflammation.",
  note_ar:"تنخفض في داء ويلسون، وترتفع في حالة الالتهاب." },

{ id:148, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Homocystéine', name_ar:'الهوموسيستين',
  summary_fr:"Marqueur de risque cardiovasculaire, lié aux carences en B9/B12.",
  summary_ar:"مؤشر خطر قلبي وعائي، مرتبط بنقص فيتامين B9/B12.",
  prep_fr:["Jeûne strict de 12 heures.","Transport rapide au laboratoire (instable à température ambiante)."],
  prep_ar:["صيام صارم لمدة 12 ساعة.","نقل سريع إلى المخبر (غير مستقر في درجة حرارة الغرفة)."],
  sampling_fr:["Prélèvement veineux le matin, tube glacé si transport long."],
  sampling_ar:["أخذ عينة وريدية صباحاً، أنبوب مبرد إذا كان النقل طويلاً."],
  meds_fr:["Signaler suppléments en vitamine B9/B12."],
  meds_ar:["إبلاغ عن مكملات فيتامين B9/B12."],
  note_fr:"Élevée en cas de carence en folates ou vitamine B12 — facteur de risque cardiovasculaire.",
  note_ar:"يرتفع في حالة نقص الفوليك أو فيتامين B12 — عامل خطر قلبي وعائي." },

{ id:149, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Procalcitonine (PCT)', name_ar:'البروكالسيتونين',
  summary_fr:"Marqueur d'infection bactérienne sévère, aide à guider l'antibiothérapie.",
  summary_ar:"مؤشر عدوى بكتيرية شديدة، يساعد في توجيه العلاج بالمضادات الحيوية.",
  prep_fr:["Aucune préparation particulière, souvent réalisé en urgence.","Aucun jeûne nécessaire."],
  prep_ar:["لا تحضير خاص، غالباً يُجرى في حالة طارئة.","لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler antibiothérapie en cours."],
  meds_ar:["إبلاغ عن العلاج الجاري بالمضادات الحيوية."],
  note_fr:"Plus spécifique que la CRP pour distinguer infection bactérienne et virale.",
  note_ar:"أكثر خصوصية من CRP للتمييز بين العدوى البكتيرية والفيروسية." },

{ id:150, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan pré-transfusionnel complet', name_ar:'الفحص الشامل قبل نقل الدم',
  summary_fr:"Ensemble d'analyses obligatoires avant toute transfusion sanguine.",
  summary_ar:"مجموعة تحاليل إلزامية قبل أي نقل دم.",
  prep_fr:["Aucun jeûne obligatoire.","Apporter carte de groupe sanguin si disponible."],
  prep_ar:["لا صيام إلزامي.","إحضار بطاقة فصيلة الدم إن وُجدت."],
  sampling_fr:["Prélèvement veineux, plusieurs tubes (groupage, RAI, sérologies)."],
  sampling_ar:["أخذ عينة وريدية، عدة أنابيب."],
  meds_fr:["Signaler antécédents de transfusion et réactions transfusionnelles."],
  meds_ar:["إبلاغ عن سوابق نقل الدم وردود الفعل السابقة."],
  note_fr:"Obligatoire avant toute transfusion — inclut groupage, RAI et sérologies virales.",
  note_ar:"إلزامي قبل أي نقل دم — يشمل فصيلة الدم والأجسام المضادة والفحوصات الفيروسية." },

{ id:151, cat:'biochimie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot LCR (ponction)',n_ar:'وعاء السائل النخاعي'}],
  name_fr:'Ponction lombaire (analyse du LCR)', name_ar:'البزل القطني (تحليل السائل النخاعي)',
  summary_fr:"Analyse du liquide céphalo-rachidien, réalisée en urgence hospitalière.",
  summary_ar:"تحليل السائل الدماغي الشوكي، يُجرى في حالة طارئة استشفائية.",
  prep_fr:["Réalisé exclusivement à l'hôpital par un médecin.","Signaler tout trouble de la coagulation.","Position fœtale requise pendant le geste."],
  prep_ar:["يُجرى حصراً في المستشفى من قبل طبيب.","إبلاغ عن أي اضطراب في التخثر.","وضعية جنينية مطلوبة أثناء الإجراء."],
  sampling_fr:["Ponction réalisée entre deux vertèbres lombaires par un médecin spécialisé."],
  sampling_ar:["يُجرى البزل بين فقرتين قطنيتين من قبل طبيب متخصص."],
  meds_fr:["Signaler impérativement tout traitement anticoagulant."],
  meds_ar:["إبلاغ إلزامياً عن أي علاج مضاد للتخثر."],
  note_fr:"Repos allongé recommandé plusieurs heures après le geste pour éviter les céphalées.",
  note_ar:"يُنصح بالراحة مستلقياً لعدة ساعات بعد الإجراء لتجنب الصداع." },

/* ── HÉMATOLOGIE — SUITE 2 ─────────────────────────────────── */
{ id:152, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Électrophorèse des protéines sériques', name_ar:'الرحلان الكهربائي لبروتينات الدم',
  summary_fr:"Analyse fine des protéines sanguines, dépistage de pics anormaux.",
  summary_ar:"تحليل دقيق لبروتينات الدم، الكشف عن قمم غير طبيعية.",
  prep_fr:["Jeûne de 8h conseillé.","Aucune préparation spéciale au-delà."],
  prep_ar:["يُنصح بصيام 8 ساعات.","لا تحضير إضافي."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler corticothérapie et immunosuppresseurs."],
  meds_ar:["إبلاغ عن العلاج بالكورتيزون ومثبطات المناعة."],
  note_fr:"Essentiel pour le dépistage du myélome multiple (pic monoclonal).",
  note_ar:"أساسي للكشف عن المايلوما المتعددة." },

{ id:153, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Haptoglobine', name_ar:'الهابتوغلوبين',
  summary_fr:"Marqueur d'hémolyse (destruction des globules rouges).",
  summary_ar:"مؤشر انحلال الدم (تدمير كريات الدم الحمراء).",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple, éviter hémolyse à la ponction."],
  sampling_ar:["أخذ عينة وريدية بسيطة، تجنب انحلال الدم أثناء أخذ العينة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Diminue fortement en cas d'hémolyse — utile pour confirmer une anémie hémolytique.",
  note_ar:"ينخفض بشدة في حالة انحلال الدم — مفيد لتأكيد فقر الدم الانحلالي." },

{ id:154, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Test de fragilité osmotique', name_ar:'اختبار الهشاشة الأسموزية',
  summary_fr:"Dépistage de sphérocytose héréditaire.",
  summary_ar:"الكشف عن كثرة الكريات الكروية الوراثية.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler transfusion récente."],
  meds_ar:["إبلاغ عن نقل الدم الحديث."],
  note_fr:"Utile pour explorer une anémie hémolytique d'origine héréditaire.",
  note_ar:"مفيد لفحص فقر الدم الانحلالي الوراثي." },

/* ── COAGULATION — SUITE 2 ─────────────────────────────────── */
{ id:155, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'Anticoagulant circulant (lupique)', name_ar:'مضاد التخثر الذئبي',
  summary_fr:"Bilan de thrombophilie et de fausses couches à répétition.",
  summary_ar:"فحص التخثر الوراثي والإجهاض المتكرر.",
  prep_fr:["Aucun jeûne nécessaire.","À distance d'un épisode thrombotique aigu."],
  prep_ar:["لا حاجة للصيام.","بعيداً عن نوبة جلطة حادة."],
  sampling_fr:["Prélèvement veineux, tube citraté."],
  sampling_ar:["أخذ عينة وريدية، أنبوب سيترات."],
  meds_fr:["Signaler impérativement anticoagulants en cours."],
  meds_ar:["إبلاغ إلزامياً عن مضادات التخثر الجارية."],
  note_fr:"Recherché en cas de fausses couches répétées ou de thrombose sans cause évidente.",
  note_ar:"يُبحث عنه في حالة الإجهاض المتكرر أو الجلطة دون سبب واضح." },

{ id:156, cat:'coagulation', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'Mutation Facteur V Leiden', name_ar:'طفرة العامل الخامس ليدن',
  summary_fr:"Test génétique de thrombophilie héréditaire.",
  summary_ar:"فحص وراثي للتخثر الوراثي.",
  prep_fr:["Aucun jeûne nécessaire.","Consentement éclairé requis (test génétique)."],
  prep_ar:["لا حاجة للصيام.","يتطلب موافقة مستنيرة (فحص وراثي)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament n'influence ce test génétique."],
  meds_ar:["لا دواء يؤثر على هذا الفحص الوراثي."],
  note_fr:"Résultat stable dans le temps, peut être réalisé même sous anticoagulant.",
  note_ar:"النتيجة ثابتة عبر الزمن، يمكن إجراؤها حتى تحت مضاد التخثر." },

/* ── UROLOGIE — SUITE 2 ─────────────────────────────────────── */
{ id:157, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Cytologie urinaire', name_ar:'الخلايا في البول',
  summary_fr:"Recherche de cellules anormales dans les urines.",
  summary_ar:"البحث عن خلايا غير طبيعية في البول.",
  prep_fr:["Recueillir le deuxième jet urinaire du matin.","Bien s'hydrater avant le prélèvement."],
  prep_ar:["جمع الدفعة البولية الثانية صباحاً.","شرب كمية كافية من الماء قبل أخذ العينة."],
  sampling_fr:["Recueillir dans un pot stérile, apporter rapidement au laboratoire."],
  sampling_ar:["الجمع في وعاء معقم، إحضاره بسرعة للمخبر."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Souvent répété sur 3 jours consécutifs pour améliorer la sensibilité.",
  note_ar:"غالباً يُكرر على 3 أيام متتالية لتحسين الحساسية." },

{ id:158, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche de calculs urinaires (analyse morpho-constitutionnelle)', name_ar:'تحليل الحصى البولية',
  summary_fr:"Analyse chimique d'un calcul urinaire expulsé ou retiré.",
  summary_ar:"تحليل كيميائي لحصاة بولية مطرودة أو مستأصلة.",
  prep_fr:["Récupérer le calcul dès son émission (filtrer les urines si besoin).","Le conserver au sec dans un contenant propre."],
  prep_ar:["استرجاع الحصاة فور خروجها (تصفية البول عند الحاجة).","حفظها جافة في وعاء نظيف."],
  sampling_fr:["Apporter directement le calcul au laboratoire, pas besoin de liquide de conservation."],
  sampling_ar:["إحضار الحصاة مباشرة إلى المخبر، لا حاجة لسائل حفظ."],
  meds_fr:["Signaler traitement en cours pour lithiase urinaire."],
  meds_ar:["إبلاغ عن أي علاج جارٍ لحصى الكلى."],
  note_fr:"Important pour adapter le régime alimentaire et prévenir la récidive.",
  note_ar:"مهم لتكييف النظام الغذائي ومنع تكرار الحصى." },

{ id:159, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot urine 24h',n_ar:'وعاء بول 24 ساعة'}],
  name_fr:'Uricosurie (acide urique urinaire 24h)', name_ar:'حمض اليوريك في البول 24 ساعة',
  summary_fr:"Évalue l'élimination urinaire de l'acide urique.",
  summary_ar:"يقيّم إفراغ حمض اليوريك عبر البول.",
  prep_fr:["Recueil urinaire des 24h selon protocole standard.","Éviter alcool et abats pendant la période de recueil."],
  prep_ar:["جمع البول لمدة 24 ساعة حسب البروتوكول القياسي.","تجنب الكحول والأحشاء خلال فترة الجمع."],
  sampling_fr:["Recueillir toutes les urines sur 24h dans le bidon fourni."],
  sampling_ar:["جمع كل البول لمدة 24 ساعة في الوعاء المقدم."],
  meds_fr:["Signaler traitement anti-goutte en cours."],
  meds_ar:["إبلاغ عن علاج النقرس الجاري."],
  note_fr:"Utile pour classer le type de lithiase urique (sur-production vs sous-excrétion).",
  note_ar:"مفيد لتصنيف نوع حصى اليوريك." },

/* ── PARASITOLOGIE — SUITE 2 ───────────────────────────────── */
{ id:160, cat:'parasitologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Trichinellose', name_ar:'فحص داء الشعرينات',
  summary_fr:"Dépistage suite à la consommation de viande insuffisamment cuite.",
  summary_ar:"الكشف بعد تناول لحم غير مطبوخ جيداً.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler consommation récente de viande de porc, sanglier ou cheval mal cuite."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن تناول حديث للحم خنزير أو خنزير بري غير مطبوخ جيداً."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Rare mais possible après consommation de viande d'origine douteuse.",
  note_ar:"نادر لكن ممكن بعد تناول لحم مشكوك في مصدره." },

{ id:161, cat:'parasitologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Fasciolose (Douve du foie)', name_ar:'فحص داء المتورقة الكبدية',
  summary_fr:"Dépistage après consommation de cresson sauvage contaminé.",
  summary_ar:"الكشف بعد تناول جرجير بري ملوث.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler consommation de cresson sauvage ou légumes aquatiques non lavés."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن تناول جرجير بري أو خضروات مائية غير مغسولة."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Toujours bien laver et cuire le cresson sauvage pour éviter cette infection.",
  note_ar:"يجب دائماً غسل وطبخ الجرجير البري جيداً لتجنب هذه العدوى." },

{ id:162, cat:'parasitologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'Recherche de Taenia (ver solitaire)', name_ar:'البحث عن الدودة الشريطية',
  summary_fr:"Dépistage du ver solitaire suite à consommation de viande crue.",
  summary_ar:"الكشف عن الدودة الشريطية بعد تناول لحم نيء.",
  prep_fr:["Recueillir les selles fraîches.","Signaler si des anneaux blancs ont été observés dans les selles ou les sous-vêtements."],
  prep_ar:["جمع براز طازج.","إبلاغ في حال ملاحظة حلقات بيضاء في البراز أو الملابس الداخلية."],
  sampling_fr:["Recueillir dans le pot stérile, idéalement avec un anneau si visible."],
  sampling_ar:["الجمع في الوعاء المعقم، يفضل مع حلقة إن أمكن رؤيتها."],
  meds_fr:["Signaler tout traitement antiparasitaire récent."],
  meds_ar:["إبلاغ عن أي علاج مضاد للطفيليات حديث."],
  note_fr:"Souvent lié à la consommation de viande bovine ou porcine insuffisamment cuite.",
  note_ar:"غالباً مرتبط بتناول لحم بقري أو خنزيري غير مطبوخ جيداً." },

/* ── COMPLÉMENTS PÉDIATRIQUES / GROSSESSE ──────────────────── */
{ id:163, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Triple test / Test combiné du 1er trimestre', name_ar:'الفحص الثلاثي للثلث الأول من الحمل',
  summary_fr:"Dépistage de la trisomie 21, combiné à l'échographie.",
  summary_ar:"الكشف عن متلازمة داون، مقترن بالفحص بالموجات فوق الصوتية.",
  prep_fr:["Aucun jeûne nécessaire.","Doit être réalisé entre 11 et 14 semaines d'aménorrhée précisément."],
  prep_ar:["لا حاجة للصيام.","يجب إجراؤه بين الأسبوع 11 و14 من الحمل بدقة."],
  sampling_fr:["Prélèvement veineux simple, combiné aux mesures échographiques (clarté nucale)."],
  sampling_ar:["أخذ عينة وريدية بسيطة، مقترنة بقياسات الموجات فوق الصوتية."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Le timing précis (date de grossesse) est essentiel pour l'interprétation du risque.",
  note_ar:"التوقيت الدقيق (تاريخ الحمل) ضروري لتفسير نسبة الخطر." },

{ id:164, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan prénatal du 1er trimestre', name_ar:'الفحص الشامل للثلث الأول من الحمل',
  summary_fr:"Ensemble d'analyses obligatoires en début de grossesse en Algérie.",
  summary_ar:"مجموعة تحاليل إلزامية في بداية الحمل في الجزائر.",
  prep_fr:["Jeûne de 8h recommandé pour la glycémie incluse.","Aucune restriction pour les autres tests du bilan."],
  prep_ar:["يُنصح بصيام 8 ساعات لفحص السكر المضمن.","لا قيود للتحاليل الأخرى."],
  sampling_fr:["Prélèvement veineux, plusieurs tubes (NFS, groupage, glycémie, sérologies, TSH)."],
  sampling_ar:["أخذ عينة وريدية، عدة أنابيب."],
  meds_fr:["Signaler tout traitement en cours, notamment acide folique."],
  meds_ar:["إبلاغ عن أي علاج جارٍ، خاصة حمض الفوليك."],
  note_fr:"Comprend NFS, groupage/Rhésus, glycémie, sérologies (toxo, rubéole, syphilis, VIH, hépatites), TSH.",
  note_ar:"يشمل تعداد الدم، فصيلة الدم، السكر، الفحوصات المصلية، TSH." },

{ id:165, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan prénatal du 6ème mois', name_ar:'الفحص الشامل للشهر السادس من الحمل',
  summary_fr:"Contrôle obligatoire au 3e trimestre de grossesse en Algérie.",
  summary_ar:"مراقبة إلزامية في الثلث الثالث من الحمل في الجزائر.",
  prep_fr:["Jeûne de 8h si HGPO incluse.","Aucune restriction pour les sérologies de contrôle."],
  prep_ar:["صيام 8 ساعات إذا شمل فحص تحمل السكر.","لا قيود للفحوصات المصلية الرقابية."],
  sampling_fr:["Prélèvement veineux, plusieurs tubes selon les tests demandés."],
  sampling_ar:["أخذ عينة وريدية، عدة أنابيب حسب التحاليل المطلوبة."],
  meds_fr:["Signaler tout traitement en cours durant la grossesse."],
  meds_ar:["إبلاغ عن أي علاج جارٍ أثناء الحمل."],
  note_fr:"Comprend NFS, HGPO (dépistage diabète gestationnel), RAI si Rhésus négatif, AgHBs.",
  note_ar:"يشمل تعداد الدم، فحص تحمل السكر، الأجسام المضادة إذا كانت الفصيلة سلبية." },

/* ── BACTÉRIOLOGIE — DIVERS COMPLÉMENTAIRES ─────────────────── */
{ id:166, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon stérile',n_ar:'مسحة معقمة'}],
  name_fr:'Prélèvement de gorge — Recherche de Candida', name_ar:'مسحة الحلق — البحث عن المبيضات',
  summary_fr:"Recherche de candidose buccale (muguet), fréquente chez le nourrisson.",
  summary_ar:"البحث عن داء المبيضات الفموي، شائع عند الرضع.",
  prep_fr:["Ne pas manger ni boire 1h avant le prélèvement.","Ne pas utiliser de bain de bouche antifongique avant."],
  prep_ar:["عدم الأكل أو الشرب لمدة ساعة قبل أخذ العينة.","عدم استخدام غسول فم مضاد للفطريات قبل الفحص."],
  sampling_fr:["Écouvillonnage des zones blanchâtres de la muqueuse buccale."],
  sampling_ar:["مسح المناطق البيضاء من الغشاء المخاطي الفموي."],
  meds_fr:["Signaler traitement antifongique local récent."],
  meds_ar:["إبلاغ عن علاج مضاد للفطريات موضعي حديث."],
  note_fr:"Très fréquent chez le nourrisson allaité et sous antibiotiques.",
  note_ar:"شائع جداً عند الرضع المرضعين والذين يتناولون مضادات حيوية." },

{ id:167, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon péri-anal',n_ar:'مسحة حول الشرج'}],
  name_fr:'Prélèvement péri-anal (streptocoque)', name_ar:'مسحة حول الشرج (المكورات العقدية)',
  summary_fr:"Recherche d'infection à streptocoque du groupe A chez l'enfant.",
  summary_ar:"البحث عن عدوى المكورات العقدية من الزمرة A عند الأطفال.",
  prep_fr:["Ne pas appliquer de crème ou pommade locale avant le test.","Éviter la toilette juste avant le prélèvement."],
  prep_ar:["عدم وضع كريم أو مرهم موضعي قبل الفحص.","تجنب النظافة قبل أخذ العينة مباشرة."],
  sampling_fr:["Écouvillonnage doux de la région péri-anale par le personnel médical."],
  sampling_ar:["مسح لطيف لمنطقة حول الشرج من قبل الطاقم الطبي."],
  meds_fr:["Signaler traitement antibiotique local ou systémique récent."],
  meds_ar:["إبلاغ عن علاج مضاد حيوي موضعي أو جهازي حديث."],
  note_fr:"Cause fréquente de dermatite péri-anale persistante chez l'enfant.",
  note_ar:"سبب شائع لالتهاب الجلد حول الشرج المستمر عند الأطفال." },

{ id:168, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Liquide articulaire',n_ar:'سائل مفصلي'}],
  name_fr:'Ponction articulaire (liquide synovial)', name_ar:'بزل السائل الزليلي',
  summary_fr:"Analyse du liquide articulaire, recherche d'infection ou de cristaux.",
  summary_ar:"تحليل السائل المفصلي، البحث عن عدوى أو بلورات.",
  prep_fr:["Réalisé par un médecin en milieu stérile.","Signaler tout traitement anticoagulant avant le geste."],
  prep_ar:["يُجرى من قبل طبيب في وسط معقم.","إبلاغ عن أي علاج مضاد للتخثر قبل الإجراء."],
  sampling_fr:["Ponction de l'articulation concernée (genou le plus souvent) par le médecin."],
  sampling_ar:["بزل المفصل المعني (الركبة غالباً) من قبل الطبيب."],
  meds_fr:["Signaler impérativement anticoagulants et anti-inflammatoires."],
  meds_ar:["إبلاغ إلزامياً عن مضادات التخثر ومضادات الالتهاب."],
  note_fr:"Urgence en cas de suspicion d'arthrite septique — diagnostic et traitement rapides nécessaires.",
  note_ar:"حالة طارئة عند الاشتباه بالتهاب المفصل الجرثومي — يلزم تشخيص وعلاج سريعان." },

/* ── BIOCHIMIE — SUITE FINALE ──────────────────────────────── */
{ id:169, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Digoxinémie (dosage de la digoxine)', name_ar:'قياس الديجوكسين',
  summary_fr:"Surveillance thérapeutique d'un médicament cardiaque à marge étroite.",
  summary_ar:"مراقبة علاجية لدواء قلبي بهامش أمان ضيق.",
  prep_fr:["Prélèvement à distance de la prise (généralement 6-8h après, avant la prochaine dose)."],
  prep_ar:["أخذ العينة بعيداً عن موعد الجرعة (عادة 6-8 ساعات بعدها، قبل الجرعة التالية)."],
  sampling_fr:["Prélèvement veineux, noter précisément l'heure de la dernière prise."],
  sampling_ar:["أخذ عينة وريدية، تدوين وقت آخر جرعة بدقة."],
  meds_fr:["Signaler impérativement l'heure exacte de la dernière prise de digoxine."],
  meds_ar:["إبلاغ إلزامياً عن الوقت الدقيق لآخر جرعة ديجوكسين."],
  note_fr:"Marge thérapeutique très étroite — le timing du prélèvement est critique.",
  note_ar:"هامش علاجي ضيق جداً — توقيت أخذ العينة حاسم." },

{ id:170, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Lithiémie (dosage du lithium)', name_ar:'قياس الليثيوم',
  summary_fr:"Surveillance thérapeutique du lithium, traitement psychiatrique.",
  summary_ar:"مراقبة علاجية لليثيوم، علاج نفسي.",
  prep_fr:["Prélèvement 12h après la dernière prise (généralement le matin avant la dose)."],
  prep_ar:["أخذ العينة بعد 12 ساعة من آخر جرعة (عادة صباحاً قبل الجرعة)."],
  sampling_fr:["Prélèvement veineux le matin, à jeun de préférence."],
  sampling_ar:["أخذ عينة وريدية صباحاً، يفضل على الريق."],
  meds_fr:["Signaler impérativement l'heure exacte de la dernière prise de lithium."],
  meds_ar:["إبلاغ إلزامياً عن الوقت الدقيق لآخر جرعة ليثيوم."],
  note_fr:"Marge thérapeutique étroite — surveillance régulière indispensable (risque de toxicité).",
  note_ar:"هامش علاجي ضيق — المراقبة المنتظمة ضرورية." },

{ id:171, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la carbamazépine', name_ar:'قياس الكاربامازيبين',
  summary_fr:"Surveillance thérapeutique d'un antiépileptique.",
  summary_ar:"مراقبة علاجية لدواء مضاد للصرع.",
  prep_fr:["Prélèvement juste avant la prochaine prise (taux résiduel/vallée)."],
  prep_ar:["أخذ العينة قبل الجرعة التالية مباشرة."],
  sampling_fr:["Prélèvement veineux, noter l'heure de la dernière prise."],
  sampling_ar:["أخذ عينة وريدية، تدوين وقت آخر جرعة."],
  meds_fr:["Signaler l'heure exacte et la dose du traitement antiépileptique."],
  meds_ar:["إبلاغ عن الوقت الدقيق وجرعة العلاج المضاد للصرع."],
  note_fr:"Important pour ajuster la dose et éviter les crises ou la toxicité.",
  note_ar:"مهم لضبط الجرعة وتجنب النوبات أو التسمم." },

{ id:172, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la valproate (Dépakine)', name_ar:'قياس فالبروات (ديباكين)',
  summary_fr:"Surveillance thérapeutique d'un antiépileptique/thymorégulateur.",
  summary_ar:"مراقبة علاجية لدواء مضاد للصرع.",
  prep_fr:["Prélèvement juste avant la prochaine prise (taux résiduel)."],
  prep_ar:["أخذ العينة قبل الجرعة التالية مباشرة."],
  sampling_fr:["Prélèvement veineux, noter précisément l'horaire de prise."],
  sampling_ar:["أخذ عينة وريدية، تدوين وقت الجرعة بدقة."],
  meds_fr:["Signaler l'heure exacte de la dernière prise du traitement."],
  meds_ar:["إبلاغ عن الوقت الدقيق لآخر جرعة من العلاج."],
  note_fr:"Le respect strict de l'horaire de prélèvement est indispensable pour l'interprétation.",
  note_ar:"احترام دقيق لتوقيت أخذ العينة ضروري للتفسير." },

{ id:173, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la vancomycine', name_ar:'قياس الفانكومايسين',
  summary_fr:"Surveillance thérapeutique d'un antibiotique à marge étroite en hospitalisation.",
  summary_ar:"مراقبة علاجية لمضاد حيوي بهامش ضيق أثناء الاستشفاء.",
  prep_fr:["Réalisé en milieu hospitalier, timing précis selon protocole (résiduel avant dose suivante)."],
  prep_ar:["يُجرى في وسط استشفائي، توقيت دقيق حسب البروتوكول."],
  sampling_fr:["Prélèvement veineux, horaire déterminé par le protocole hospitalier."],
  sampling_ar:["أخذ عينة وريدية، التوقيت يحدده البروتوكول الاستشفائي."],
  meds_fr:["Signaler l'heure exacte de la dernière perfusion."],
  meds_ar:["إبلاغ عن الوقت الدقيق لآخر تسريب."],
  note_fr:"Surveillance essentielle pour éviter la toxicité rénale de cet antibiotique.",
  note_ar:"مراقبة أساسية لتجنب السمية الكلوية لهذا المضاد الحيوي." },

{ id:174, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Typage HLA B27', name_ar:'تنميط HLA B27',
  summary_fr:"Test génétique associé aux spondylarthropathies.",
  summary_ar:"فحص وراثي مرتبط بالتهاب الفقار اللاصق.",
  prep_fr:["Aucun jeûne nécessaire.","Consentement éclairé requis (test génétique)."],
  prep_ar:["لا حاجة للصيام.","يتطلب موافقة مستنيرة (فحص وراثي)."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament n'influence ce test génétique."],
  meds_ar:["لا دواء يؤثر على هذا الفحص الوراثي."],
  note_fr:"Test à visée diagnostique dans le contexte de douleurs lombaires inflammatoires.",
  note_ar:"فحص تشخيصي في سياق آلام أسفل الظهر الالتهابية." },

{ id:175, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Ammoniémie (Ammoniac sanguin)', name_ar:'الأمونيا في الدم',
  summary_fr:"Explore l'encéphalopathie hépatique et certaines maladies métaboliques.",
  summary_ar:"يفحص اعتلال الدماغ الكبدي وبعض الأمراض الاستقلابية.",
  prep_fr:["Jeûne de 8h recommandé.","Transport immédiat au laboratoire sur glace (très instable)."],
  prep_ar:["يُنصح بصيام 8 ساعات.","نقل فوري إلى المخبر على الثلج (غير مستقر جداً)."],
  sampling_fr:["Prélèvement veineux sans garrot prolongé, analyse dans les 15-20 minutes."],
  sampling_ar:["أخذ عينة وريدية دون رباط ضاغط طويل، التحليل خلال 15-20 دقيقة."],
  meds_fr:["Signaler tout traitement pour maladie hépatique."],
  meds_ar:["إبلاغ عن أي علاج لمرض الكبد."],
  note_fr:"Test très sensible aux conditions de prélèvement — délai d'analyse extrêmement court requis.",
  note_ar:"فحص حساس جداً لظروف أخذ العينة — يتطلب مدة تحليل قصيرة جداً." },

{ id:176, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan des porphyries', name_ar:'فحص البورفيريا',
  summary_fr:"Dépistage des maladies métaboliques rares affectant la synthèse de l'hème.",
  summary_ar:"الكشف عن أمراض استقلابية نادرة تؤثر على تصنيع الهيم.",
  prep_fr:["Protéger l'échantillon de la lumière (sensible).","Recueil urinaire et sanguin souvent combinés."],
  prep_ar:["حماية العينة من الضوء (حساسة).","الجمع البولي والدموي غالباً مقترنان."],
  sampling_fr:["Prélèvement veineux et urinaire, tubes/pots opaques fournis par le laboratoire."],
  sampling_ar:["أخذ عينة وريدية وبولية، أوعية معتمة يقدمها المخبر."],
  meds_fr:["Signaler tout médicament pouvant déclencher une crise de porphyrie (barbituriques notamment)."],
  meds_ar:["إبلاغ عن أي دواء قد يسبب نوبة بورفيريا."],
  note_fr:"Maladie rare mais nécessitant une prise en charge spécialisée immédiate en cas de crise.",
  note_ar:"مرض نادر لكن يتطلب رعاية متخصصة فورية في حالة النوبة." },

/* ── SÉROLOGIE — SUITE 2 ────────────────────────────────────── */
{ id:177, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Varicelle-Zona (VZV)', name_ar:'فحص جدري الماء والحزام الناري',
  summary_fr:"Vérifie l'immunité contre la varicelle, important en grossesse.",
  summary_ar:"يتحقق من المناعة ضد جدري الماء، مهم أثناء الحمل.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler contact récent avec une personne atteinte de varicelle."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن تلامس حديث مع شخص مصاب بجدري الماء."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler vaccination récente contre la varicelle."],
  meds_ar:["إبلاغ عن التطعيم الحديث ضد جدري الماء."],
  note_fr:"Important chez la femme enceinte non immunisée exposée à un cas de varicelle.",
  note_ar:"مهم عند الحامل غير المحصنة المعرضة لحالة جدري الماء." },

{ id:178, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Rougeole', name_ar:'فحص الحصبة',
  summary_fr:"Vérifie l'immunité contre la rougeole.",
  summary_ar:"يتحقق من المناعة ضد الحصبة.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler statut vaccinal (ROR)."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن الحالة التطعيمية."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler vaccination récente contre la rougeole."],
  meds_ar:["إبلاغ عن التطعيم الحديث ضد الحصبة."],
  note_fr:"Utile en contexte d'épidémie ou avant certains voyages.",
  note_ar:"مفيد في سياق وباء أو قبل بعض السفريات." },

{ id:179, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Oreillons', name_ar:'فحص النكاف',
  summary_fr:"Vérifie l'immunité contre les oreillons.",
  summary_ar:"يتحقق من المناعة ضد النكاف.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler vaccination récente (ROR)."],
  meds_ar:["إبلاغ عن التطعيم الحديث."],
  note_fr:"Peu fréquemment demandé isolément, souvent couplé au bilan rougeole-rubéole.",
  note_ar:"نادراً ما يُطلب منفرداً، غالباً يُقترن بفحص الحصبة والحصبة الألمانية." },

{ id:180, cat:'serologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Sérologie Covid-19 (Anticorps)', name_ar:'فحص كوفيد-19 (الأجسام المضادة)',
  summary_fr:"Recherche d'anticorps suite à une infection ou vaccination.",
  summary_ar:"البحث عن أجسام مضادة بعد عدوى أو تطعيم.",
  prep_fr:["Aucun jeûne nécessaire.","Signaler date d'infection ou de vaccination récente."],
  prep_ar:["لا حاجة للصيام.","إبلاغ عن تاريخ الإصابة أو التطعيم الحديث."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement immunosuppresseur en cours."],
  meds_ar:["إبلاغ عن علاج مثبط للمناعة جارٍ."],
  note_fr:"Ne remplace pas le test PCR/antigénique pour le diagnostic d'infection active.",
  note_ar:"لا يُغني عن فحص PCR/المستضد لتشخيص العدوى النشطة." },

{ id:181, cat:'bacteriologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Écouvillon nasopharyngé',n_ar:'مسحة أنفية بلعومية'}],
  name_fr:'PCR Covid-19', name_ar:'فحص PCR كوفيد-19',
  summary_fr:"Test de diagnostic direct de l'infection active par le SARS-CoV-2.",
  summary_ar:"فحص تشخيص مباشر للعدوى النشطة بفيروس كورونا.",
  prep_fr:["Ne pas manger, boire ou fumer 30 min avant le test.","Se moucher avant le prélèvement si nécessaire."],
  prep_ar:["عدم الأكل أو الشرب أو التدخين لمدة 30 دقيقة قبل الفحص.","تمخيط الأنف قبل أخذ العينة عند الحاجة."],
  sampling_fr:["Écouvillonnage nasopharyngé profond réalisé par le personnel formé."],
  sampling_ar:["مسح أنفي بلعومي عميق يقوم به طاقم مدرب."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Résultat généralement disponible en 24-48h selon le laboratoire.",
  note_ar:"النتيجة متوفرة عادة خلال 24-48 ساعة حسب المخبر." },

/* ── HORMONOLOGIE — SUITE FINALE ───────────────────────────── */
{ id:182, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Calcitonine', name_ar:'الكالسيتونين',
  summary_fr:"Marqueur du cancer médullaire de la thyroïde.",
  summary_ar:"مؤشر سرطان الغدة الدرقية النخاعي.",
  prep_fr:["Jeûne de 4h recommandé.","Éviter effort physique intense avant le test."],
  prep_ar:["يُنصح بصيام 4 ساعات.","تجنب المجهود البدني الشديد قبل الفحص."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement par inhibiteurs de la pompe à protons (peuvent l'élever)."],
  meds_ar:["إبلاغ عن علاج مثبطات مضخة البروتون (قد ترفعها)."],
  note_fr:"Élevée également en cas d'insuffisance rénale ou de tabagisme.",
  note_ar:"ترتفع أيضاً في حالة قصور الكلى أو التدخين." },

{ id:183, cat:'hormonologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Rénine et Aldostérone', name_ar:'الرينين والألدوستيرون',
  summary_fr:"Explore l'hypertension d'origine surrénalienne.",
  summary_ar:"يفحص ارتفاع ضغط الدم ذا المنشأ الكظري.",
  prep_fr:["Prélèvement en position debout après 2h d'orthostatisme (ou couché selon protocole).","Arrêter certains antihypertenseurs 2 semaines avant si possible (avis médical requis).","Régime normosodé les jours précédents."],
  prep_ar:["أخذ العينة واقفاً بعد ساعتين من الوقوف (أو مستلقياً حسب البروتوكول).","التوقف عن بعض أدوية ضغط الدم قبل أسبوعين إن أمكن (يتطلب رأياً طبياً).","نظام غذائي طبيعي الملح في الأيام السابقة."],
  sampling_fr:["Prélèvement veineux selon protocole précis (position et horaire stricts)."],
  sampling_ar:["أخذ عينة وريدية حسب بروتوكول دقيق (وضعية وتوقيت صارمان)."],
  meds_fr:["Signaler impérativement TOUS les antihypertenseurs — la plupart interfèrent avec ce test."],
  meds_ar:["إبلاغ إلزامياً عن جميع أدوية ضغط الدم — معظمها يتداخل مع هذا الفحص."],
  note_fr:"Test complexe nécessitant souvent un arrêt temporaire des traitements — toujours sous supervision médicale.",
  note_ar:"فحص معقد يتطلب غالباً وقفاً مؤقتاً للعلاجات — دائماً تحت إشراف طبي." },

{ id:184, cat:'hormonologie', fasting:8, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Métanéphrines urinaires/sanguines', name_ar:'الميتانفرين في البول/الدم',
  summary_fr:"Dépistage du phéochromocytome, tumeur rare de la surrénale.",
  summary_ar:"الكشف عن ورم القواتم، ورم نادر في الغدة الكظرية.",
  prep_fr:["Éviter café, thé, chocolat, bananes, agrumes 3 jours avant.","Éviter le stress et l'effort physique avant le prélèvement.","Rester au repos allongé 20-30 min avant si dosage sanguin."],
  prep_ar:["تجنب القهوة والشاي والشوكولاتة والموز والحمضيات قبل 3 أيام.","تجنب التوتر والمجهود البدني قبل أخذ العينة.","الراحة مستلقياً لمدة 20-30 دقيقة قبل الفحص الدموي."],
  sampling_fr:["Prélèvement veineux après repos, ou recueil urinaire de 24h selon prescription."],
  sampling_ar:["أخذ عينة وريدية بعد الراحة، أو جمع بول 24 ساعة حسب الوصفة."],
  meds_fr:["Signaler impérativement bêta-bloquants, antidépresseurs tricycliques, decongestionnants."],
  meds_ar:["إبلاغ إلزامياً عن حاصرات بيتا، مضادات الاكتئاب ثلاثية الحلقات، مزيلات الاحتقان."],
  note_fr:"De nombreux aliments et médicaments interfèrent — respecter scrupuleusement les restrictions.",
  note_ar:"العديد من الأطعمة والأدوية تتداخل — يجب احترام القيود بدقة." },

/* ── BIOCHIMIE — FINAL BATCH POUR DÉPASSER 200 ─────────────── */
{ id:185, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan lipidique chez l\'enfant', name_ar:'فحص الدهون عند الطفل',
  summary_fr:"Dépistage précoce des dyslipidémies familiales.",
  summary_ar:"الكشف المبكر عن اضطرابات الدهون الوراثية.",
  prep_fr:["Jeûne de 8-10h adapté à l'âge de l'enfant.","Rassurer l'enfant avant le prélèvement pour limiter le stress."],
  prep_ar:["صيام 8-10 ساعات حسب عمر الطفل.","طمأنة الطفل قبل أخذ العينة للحد من التوتر."],
  sampling_fr:["Prélèvement veineux simple, adapté à la taille de l'enfant."],
  sampling_ar:["أخذ عينة وريدية بسيطة، مناسبة لحجم الطفل."],
  meds_fr:["Aucun médicament particulier à signaler généralement."],
  meds_ar:["عادة لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Recommandé si antécédents familiaux de maladie cardiovasculaire précoce.",
  note_ar:"يُنصح به في حالة سوابق عائلية لمرض قلبي وعائي مبكر." },

{ id:186, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan hépatique chez la femme enceinte (cholestase gravidique)', name_ar:'فحص الكبد عند الحامل',
  summary_fr:"Dépistage de la cholestase gravidique, cause de prurit intense.",
  summary_ar:"الكشف عن ركود صفراوي الحمل، سبب حكة شديدة.",
  prep_fr:["Jeûne de 8h recommandé.","Signaler tout prurit (démangeaison) notamment des paumes et plantes."],
  prep_ar:["يُنصح بصيام 8 ساعات.","إبلاغ عن أي حكة، خاصة في راحة اليدين وباطن القدمين."],
  sampling_fr:["Prélèvement veineux simple, inclut transaminases et acides biliaires."],
  sampling_ar:["أخذ عينة وريدية بسيطة، تشمل الإنزيمات الكبدية وأحماض الصفراء."],
  meds_fr:["Signaler tout traitement en cours durant la grossesse."],
  meds_ar:["إبلاغ عن أي علاج جارٍ أثناء الحمل."],
  note_fr:"Diagnostic important — la cholestase gravidique nécessite une surveillance fœtale rapprochée.",
  note_ar:"تشخيص مهم — ركود صفراوي الحمل يتطلب مراقبة دقيقة للجنين." },

{ id:187, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Acides biliaires (grossesse)', name_ar:'أحماض الصفراء (الحمل)',
  summary_fr:"Confirme le diagnostic de cholestase gravidique.",
  summary_ar:"يؤكد تشخيص ركود صفراوي الحمل.",
  prep_fr:["Jeûne de 8h recommandé pour une interprétation optimale."],
  prep_ar:["يُنصح بصيام 8 ساعات للتفسير الأمثل."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement par acide ursodésoxycholique si déjà débuté."],
  meds_ar:["إبلاغ عن علاج حمض أورسوديوكسيكوليك إذا بدأ بالفعل."],
  note_fr:"Taux élevé associé à un risque accru de complications fœtales — surveillance nécessaire.",
  note_ar:"المعدل المرتفع مرتبط بزيادة خطر مضاعفات الجنين — تلزم المراقبة." },

{ id:188, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan martial chez le nourrisson', name_ar:'فحص الحديد عند الرضيع',
  summary_fr:"Dépistage de l'anémie ferriprive du nourrisson, fréquente en Algérie.",
  summary_ar:"الكشف عن فقر الدم الناتج عن نقص الحديد عند الرضع، شائع في الجزائر.",
  prep_fr:["Aucun jeûne strict nécessaire chez le nourrisson.","Prélèvement de préférence à distance d'un repas de lait."],
  prep_ar:["لا صيام صارم ضروري عند الرضيع.","يفضل أخذ العينة بعيداً عن وجبة الحليب."],
  sampling_fr:["Prélèvement veineux ou capillaire (talon) selon l'âge."],
  sampling_ar:["أخذ عينة وريدية أو شعرية (كعب القدم) حسب العمر."],
  meds_fr:["Signaler toute supplémentation en fer déjà en cours."],
  meds_ar:["إبلاغ عن أي تكميل بالحديد جارٍ بالفعل."],
  note_fr:"Dépistage recommandé systématiquement chez le nourrisson entre 9 et 12 mois en Algérie.",
  note_ar:"يُنصح بالكشف المنتظم عند الرضيع بين 9 و12 شهراً في الجزائر." },

{ id:189, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Bilan thyroïdien chez la femme enceinte', name_ar:'فحص الغدة الدرقية عند الحامل',
  summary_fr:"Surveillance thyroïdienne adaptée aux besoins de la grossesse.",
  summary_ar:"مراقبة الغدة الدرقية حسب احتياجات الحمل.",
  prep_fr:["Aucun jeûne obligatoire.","Prélèvement matinal recommandé si possible."],
  prep_ar:["لا صيام إلزامي.","يُنصح بأخذ العينة صباحاً إن أمكن."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler tout traitement thyroïdien et l'heure de la dernière prise."],
  meds_ar:["إبلاغ عن أي علاج للغدة الدرقية ووقت آخر جرعة."],
  note_fr:"Les valeurs normales de la TSH diffèrent de la population générale durant la grossesse.",
  note_ar:"القيم الطبيعية لـTSH تختلف عن عامة السكان أثناء الحمل." },

{ id:190, cat:'biochimie', fasting:12, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'HGPO grossesse (dépistage diabète gestationnel — 75g)', name_ar:'فحص تحمل السكر للحامل',
  summary_fr:"Test standard de dépistage du diabète gestationnel entre 24-28 semaines.",
  summary_ar:"فحص قياسي للكشف عن سكري الحمل بين الأسبوع 24-28.",
  prep_fr:["Jeûne strict de 12 heures.","Réalisé entre la 24e et la 28e semaine d'aménorrhée.","Alimentation normale les 3 jours précédents."],
  prep_ar:["صيام صارم لمدة 12 ساعة.","يُجرى بين الأسبوع 24 و28 من الحمل.","نظام غذائي طبيعي خلال 3 أيام قبل الفحص."],
  sampling_fr:["Prélèvement à jeun, ingestion de 75g de glucose, prélèvements à H1 et H2.","Rester assise et calme pendant les 2 heures du test."],
  sampling_ar:["أخذ عينة على الريق، شرب 75غ جلوكوز، عينات بعد ساعة وساعتين.","الجلوس بهدوء طوال ساعتي الفحص."],
  meds_fr:["Signaler tout traitement en cours durant la grossesse."],
  meds_ar:["إبلاغ عن أي علاج جارٍ أثناء الحمل."],
  note_fr:"Test recommandé systématiquement chez toute femme enceinte en Algérie entre 24-28 semaines.",
  note_ar:"يُنصح به بشكل منتظم لكل حامل في الجزائر بين الأسبوع 24-28." },

{ id:191, cat:'coagulation', fasting:0, tubes:[{c:'#60a5fa',n_fr:'Bleu (citrate)',n_ar:'أزرق (سيترات)'}],
  name_fr:'Bilan de coagulation pré-accouchement', name_ar:'فحص التخثر قبل الولادة',
  summary_fr:"Contrôle systématique avant accouchement ou césarienne.",
  summary_ar:"مراقبة منتظمة قبل الولادة أو العملية القيصرية.",
  prep_fr:["Aucun jeûne nécessaire.","Réalisé généralement au 9e mois de grossesse."],
  prep_ar:["لا حاجة للصيام.","يُجرى عادة في الشهر التاسع من الحمل."],
  sampling_fr:["Prélèvement veineux, tube citraté rempli précisément."],
  sampling_ar:["أخذ عينة وريدية، أنبوب سيترات مملوء بدقة."],
  meds_fr:["Signaler tout traitement anticoagulant préventif en cours."],
  meds_ar:["إبلاغ عن أي علاج وقائي مضاد للتخثر جارٍ."],
  note_fr:"Essentiel pour la sécurité de l'anesthésie péridurale.",
  note_ar:"ضروري لسلامة التخدير فوق الجافية." },

{ id:192, cat:'hematologie', fasting:0, tubes:[{c:'#a78bfa',n_fr:'Violet (EDTA)',n_ar:'بنفسجي (EDTA)'}],
  name_fr:'NFS chez la femme enceinte', name_ar:'تعداد الدم عند الحامل',
  summary_fr:"Surveillance de l'anémie de grossesse, très fréquente en Algérie.",
  summary_ar:"مراقبة فقر دم الحمل، شائع جداً في الجزائر.",
  prep_fr:["Aucun jeûne nécessaire.","Réalisé à chaque trimestre de grossesse."],
  prep_ar:["لا حاجة للصيام.","يُجرى في كل ثلث من الحمل."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler supplémentation en fer et acide folique en cours."],
  meds_ar:["إبلاغ عن تكميل الحديد وحمض الفوليك الجاري."],
  note_fr:"L'anémie physiologique de dilution est normale en fin de grossesse — à ne pas confondre avec une vraie carence.",
  note_ar:"فقر الدم الفيزيولوجي بالتخفيف طبيعي في نهاية الحمل — يجب عدم الخلط بينه وبين نقص حقيقي." },

{ id:193, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la vitamine A', name_ar:'قياس فيتامين A',
  summary_fr:"Évalue le statut en vitamine A, rare en carence en Algérie mais surveillée.",
  summary_ar:"يقيّم حالة فيتامين A، نقصه نادر في الجزائر لكن يُراقب.",
  prep_fr:["Jeûne de 8h recommandé.","Protéger l'échantillon de la lumière."],
  prep_ar:["يُنصح بصيام 8 ساعات.","حماية العينة من الضوء."],
  sampling_fr:["Prélèvement veineux, tube ambré ou protégé de la lumière."],
  sampling_ar:["أخذ عينة وريدية، أنبوب معتم أو محمي من الضوء."],
  meds_fr:["Signaler suppléments en vitamine A."],
  meds_ar:["إبلاغ عن مكملات فيتامين A."],
  note_fr:"Vitamine sensible à la lumière — manipulation rapide requise après prélèvement.",
  note_ar:"فيتامين حساس للضوء — يتطلب معالجة سريعة بعد أخذ العينة." },

{ id:194, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la vitamine E', name_ar:'قياس فيتامين E',
  summary_fr:"Antioxydant, dosage utile en cas de malabsorption digestive.",
  summary_ar:"مضاد أكسدة، قياسه مفيد في حالة سوء امتصاص هضمي.",
  prep_fr:["Jeûne de 8h recommandé.","Protéger l'échantillon de la lumière."],
  prep_ar:["يُنصح بصيام 8 ساعات.","حماية العينة من الضوء."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler suppléments en vitamine E."],
  meds_ar:["إبلاغ عن مكملات فيتامين E."],
  note_fr:"Souvent demandé en association avec un bilan lipidique complet.",
  note_ar:"غالباً يُطلب مع الفحص الشامل للدهون." },

{ id:195, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la Béta-2 microglobuline', name_ar:'قياس بيتا-2 ميكروغلوبولين',
  summary_fr:"Marqueur de fonction rénale et de certaines pathologies lymphoïdes.",
  summary_ar:"مؤشر وظيفة الكلى وبعض أمراض الخلايا اللمفاوية.",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Utile dans le suivi du myélome multiple et de certains lymphomes.",
  note_ar:"مفيد في متابعة المايلوما المتعددة وبعض أنواع اللمفوما." },

{ id:196, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la trypsine immunoréactive (nouveau-né)', name_ar:'قياس التربسين المناعي عند حديثي الولادة',
  summary_fr:"Dépistage néonatal de la mucoviscidose.",
  summary_ar:"كشف حديثي الولادة للتليف الكيسي.",
  prep_fr:["Réalisé avec le dépistage néonatal (papier buvard talon)."],
  prep_ar:["يُجرى مع كشف حديثي الولادة (ورق ماص من كعب القدم)."],
  sampling_fr:["Prélèvement par piqûre au talon, quelques jours après la naissance."],
  sampling_ar:["أخذ عينة بوخز كعب القدم، بعد بضعة أيام من الولادة."],
  meds_fr:["Aucun médicament particulier à signaler."],
  meds_ar:["لا حاجة للإبلاغ عن أدوية معينة."],
  note_fr:"Fait partie du dépistage néonatal élargi dans certains centres en Algérie.",
  note_ar:"جزء من الكشف الموسع لحديثي الولادة في بعض المراكز بالجزائر." },

{ id:197, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage des catécholamines urinaires', name_ar:'قياس الكاتيكولامينات في البول',
  summary_fr:"Exploration complémentaire du phéochromocytome sur urines 24h.",
  summary_ar:"فحص تكميلي لورم القواتم عبر بول 24 ساعة.",
  prep_fr:["Éviter café, thé, chocolat, bananes, agrumes 3 jours avant.","Éviter le stress et l'effort physique intense.","Recueil des urines de 24h dans un bidon acidifié fourni par le laboratoire."],
  prep_ar:["تجنب القهوة والشاي والشوكولاتة والموز والحمضيات قبل 3 أيام.","تجنب التوتر والمجهود البدني الشديد.","جمع بول 24 ساعة في وعاء محمض يقدمه المخبر."],
  sampling_fr:["Recueillir toutes les urines sur 24h, conserver au frais."],
  sampling_ar:["جمع كل البول لمدة 24 ساعة، الحفظ في مكان بارد."],
  meds_fr:["Signaler impérativement bêta-bloquants et antidépresseurs."],
  meds_ar:["إبلاغ إلزامياً عن حاصرات بيتا ومضادات الاكتئاب."],
  note_fr:"Le bidon de recueil contient un conservateur acide — ne pas le jeter ni le diluer.",
  note_ar:"وعاء الجمع يحتوي على مادة حافظة حمضية — يجب عدم التخلص منها أو تخفيفها." },

{ id:198, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Test de Zimmermann (17-cétostéroïdes urinaires)', name_ar:'اختبار زيمرمان',
  summary_fr:"Exploration ancienne mais parfois utilisée de la fonction surrénalienne.",
  summary_ar:"فحص قديم لكن يُستخدم أحياناً لوظيفة الغدة الكظرية.",
  prep_fr:["Recueil urinaire de 24h.","Éviter certains médicaments interférents (à valider avec le prescripteur)."],
  prep_ar:["جمع بول 24 ساعة.","تجنب بعض الأدوية المتداخلة (يجب التحقق مع الطبيب الواصف)."],
  sampling_fr:["Recueillir toutes les urines sur 24h dans le bidon fourni."],
  sampling_ar:["جمع كل البول لمدة 24 ساعة في الوعاء المقدم."],
  meds_fr:["Signaler tout traitement hormonal ou corticoïde."],
  meds_ar:["إبلاغ عن أي علاج هرموني أو كورتيزوني."],
  note_fr:"Test de moins en moins utilisé, remplacé par des dosages hormonaux plus spécifiques.",
  note_ar:"فحص أقل استخداماً حالياً، استُبدل بقياسات هرمونية أكثر دقة." },

{ id:199, cat:'immunologie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Anticorps anti-récepteurs de la TSH (TRAK)', name_ar:'الأجسام المضادة لمستقبلات TSH',
  summary_fr:"Diagnostic de la maladie de Basedow (hyperthyroïdie auto-immune).",
  summary_ar:"تشخيص داء بازيدو (فرط نشاط الغدة المناعي).",
  prep_fr:["Aucun jeûne nécessaire."],
  prep_ar:["لا حاجة للصيام."],
  sampling_fr:["Prélèvement veineux simple."],
  sampling_ar:["أخذ عينة وريدية بسيطة."],
  meds_fr:["Signaler traitement antithyroïdien en cours."],
  meds_ar:["إبلاغ عن علاج مضاد للغدة الدرقية جارٍ."],
  note_fr:"Test très spécifique pour confirmer le diagnostic de maladie de Basedow.",
  note_ar:"فحص خاص جداً لتأكيد تشخيص داء بازيدو." },

{ id:200, cat:'biochimie', fasting:0, tubes:[{c:'#facc15',n_fr:'Jaune (sec)',n_ar:'أصفر (جاف)'}],
  name_fr:'Dosage de la Rénine plasmatique seule', name_ar:'قياس الرينين في البلازما',
  summary_fr:"Composant du bilan d'hypertension d'origine rénale ou surrénalienne.",
  summary_ar:"عنصر من فحص ارتفاع ضغط الدم ذي المنشأ الكلوي أو الكظري.",
  prep_fr:["Position debout ou couchée selon protocole précis du prescripteur.","Régime normosodé les jours précédents.","Arrêter certains antihypertenseurs selon avis médical."],
  prep_ar:["وضعية واقفة أو مستلقية حسب بروتوكول دقيق من الطبيب.","نظام غذائي طبيعي الملح في الأيام السابقة.","التوقف عن بعض أدوية ضغط الدم حسب الرأي الطبي."],
  sampling_fr:["Prélèvement veineux selon protocole positionnel strict."],
  sampling_ar:["أخذ عينة وريدية حسب بروتوكول وضعية صارم."],
  meds_fr:["Signaler impérativement tous les antihypertenseurs en cours."],
  meds_ar:["إبلاغ إلزامياً عن جميع أدوية ضغط الدم الجارية."],
  note_fr:"Interprété conjointement avec l'aldostérone pour calculer le rapport rénine/aldostérone.",
  note_ar:"يُفسَّر مع الألدوستيرون لحساب نسبة الرينين/الألدوستيرون." },

{ id:201, cat:'urologie', fasting:0, tubes:[{c:'#4ade80',n_fr:'Pot stérile',n_ar:'وعاء معقم'}],
  name_fr:'ECBU chez l\'enfant (poche à urine)', name_ar:'فحص البول عند الطفل (كيس جمع)',
  summary_fr:"Adaptation du prélèvement urinaire chez le nourrisson non propre.",
  summary_ar:"تكييف أخذ عينة البول عند الرضيع غير المدرب على النظافة.",
  prep_fr:["Toilette intime soigneuse de l'enfant avant la pose de la poche.","Poche à urine changée si non mictionnée après 30 minutes.","Apporter rapidement au laboratoire dès la miction."],
  prep_ar:["نظافة حميمة دقيقة للطفل قبل وضع الكيس.","تغيير الكيس إذا لم يحدث تبول بعد 30 دقيقة.","الإحضار السريع للمخبر فور التبول."],
  sampling_fr:["Poche stérile adhésive posée par le parent ou le personnel médical."],
  sampling_ar:["كيس معقم لاصق يضعه الوالد أو الطاقم الطبي."],
  meds_fr:["Signaler tout traitement antibiotique récent chez l'enfant."],
  meds_ar:["إبلاغ عن أي علاج حديث بالمضادات الحيوية عند الطفل."],
  note_fr:"Technique délicate — un résultat positif doit être confirmé par sondage si doute.",
  note_ar:"تقنية دقيقة — النتيجة الإيجابية يجب تأكيدها بالقسطرة عند الشك." },

];
window.LABPREP_DB_PART1 = DB;

/* ═══════════════════════════════════════════════════════════════
   UI TRANSLATIONS (static interface strings)
   ═══════════════════════════════════════════════════════════════ */
const UI = {
  fr: {
    tagline: "Guide de Préparation aux Analyses",
    heroTitle: "Préparez-vous<br/><em>correctement</em> avant<br/>votre analyse",
    heroSub: "Tapez le nom d'une analyse — obtenez immédiatement les instructions de préparation exactes pour votre laboratoire en Algérie.",
    searchPlaceholder: "Ex: Glycémie, ECBU, NFS, Bilan lipidique...",
    langBtn: "العربية",
    pillAll: "Tout",
    pillLabels: {
      biochimie:'Biochimie', hematologie:'Hématologie', bacteriologie:'Bactériologie',
      hormonologie:'Hormonologie', immunologie:'Immunologie', parasitologie:'Parasitologie',
      urologie:'Urologie', serologie:'Sérologie', coagulation:'Coagulation'
    },
    resultsFound: (n) => n + (n === 1 ? ' analyse trouvée' : ' analyses trouvées'),
    emptyTitle: "Aucune analyse trouvée",
    emptySub: "Essayez un autre terme de recherche ou une autre catégorie",
    fastingReq: (h) => `Jeûne ${h}h`,
    noFasting: "Sans jeûne",
    ctaSee: "Voir les détails",
    modalPrep: "PRÉPARATION AVANT LE TEST",
    modalSampling: "MODALITÉS DE PRÉLÈVEMENT",
    modalMeds: "MÉDICAMENTS À SIGNALER",
    modalNote: "À SAVOIR",
    modalTubes: "TUBE(S) REQUIS",
    modalFastingLabel: "Jeûne requis",
    readyBadgeText: "Vous êtes prêt(e) pour ce test !",
    footerDisclaimer: "Ces informations sont fournies à titre indicatif. Consultez toujours votre médecin ou le personnel de votre laboratoire pour des instructions personnalisées.",
    unit: "analyses"
  },
  ar: {
    tagline: "دليل التحضير للتحاليل الطبية",
    heroTitle: "استعد<br/><em>بشكل صحيح</em><br/>قبل تحليلك",
    heroSub: "اكتب اسم أي تحليل طبي — واحصل فوراً على تعليمات التحضير الدقيقة لمخبرك في الجزائر.",
    searchPlaceholder: "مثال: سكر الدم، ECBU، تعداد الدم...",
    langBtn: "Français",
    pillAll: "الكل",
    pillLabels: {
      biochimie:'كيمياء حيوية', hematologie:'أمراض الدم', bacteriologie:'جراثيم',
      hormonologie:'هرمونات', immunologie:'مناعة', parasitologie:'طفيليات',
      urologie:'بولية', serologie:'مصلية', coagulation:'تخثر'
    },
    resultsFound: (n) => n + ' تحليل موجود',
    emptyTitle: "لم يتم العثور على أي تحليل",
    emptySub: "جرّب كلمة بحث أخرى أو فئة مختلفة",
    fastingReq: (h) => `صيام ${h}س`,
    noFasting: "بدون صيام",
    ctaSee: "عرض التفاصيل",
    modalPrep: "التحضير قبل الفحص",
    modalSampling: "طريقة أخذ العينة",
    modalMeds: "الأدوية الواجب الإبلاغ عنها",
    modalNote: "معلومة مهمة",
    modalTubes: "الأنبوب (الأنابيب) المطلوبة",
    modalFastingLabel: "الصيام المطلوب",
    readyBadgeText: "أنت جاهز لهذا التحليل!",
    footerDisclaimer: "هذه المعلومات تقديمية فقط. استشر دائماً طبيبك أو طاقم المخبر للحصول على تعليمات مخصصة.",
    unit: "تحليل",
    favTitle: "تحاليلي المفضلة", favEmpty: "لا توجد تحاليل مفضلة بعد", favEmptySub: "اضغط على النجمة ⭐ في أي بطاقة لإضافتها هنا",
    timerTitle: "مؤقت الصيام", timerPick: "اختر مدة الصيام", timerStart: "ابدأ الصيام الآن",
    timerRemaining: "المتبقي", timerDoneAt: "ستنتهي في", timerCancel: "إلغاء المؤقت", timerDone: "انتهى الصيام! يمكنك الآن الذهاب للتحليل",
    contentNote: "ملاحظة: التفاصيل الكاملة معروضة بالفرنسية أدناه لضمان الدقة الطبية.",
  }
};

/* English names/summaries for all 201 tests — standard medical English terminology */
const EN_NAMES = {
1:{n:"Fasting Blood Glucose",s:"Measures blood glucose level after a strict 12-hour fast."},
2:{n:"Complete Lipid Panel",s:"Total cholesterol, HDL, LDL and triglycerides — requires 12h fasting."},
3:{n:"Blood Urea",s:"Assesses kidney function. Strict fasting not required."},
4:{n:"Serum Creatinine",s:"Essential marker of kidney function, used to calculate GFR."},
5:{n:"Liver Enzymes (AST/ALT)",s:"Liver enzymes, indicators of liver stress or damage."},
6:{n:"Total & Conjugated Bilirubin",s:"Assesses liver and biliary function, jaundice screening."},
7:{n:"Alkaline Phosphatase (ALP)",s:"Enzyme useful for exploring liver and bone conditions."},
8:{n:"Gamma GT (GGT)",s:"Sensitive marker of liver damage and alcohol consumption."},
9:{n:"C-Reactive Protein (CRP)",s:"Marker of acute inflammation or infection."},
10:{n:"Blood Electrolytes (Na, K, Cl)",s:"Measures essential blood electrolytes for body balance."},
11:{n:"Calcium (Blood)",s:"Blood calcium level, important for bones, muscles and nerves."},
12:{n:"Magnesium (Blood)",s:"Measures blood magnesium, essential for muscles and heart."},
13:{n:"Phosphorus (Blood)",s:"Phosphorus level, linked to bone and kidney metabolism."},
14:{n:"Uric Acid",s:"Gout screening and evaluation of purine metabolism."},
15:{n:"Total Protein",s:"Global measurement of blood proteins (albumin + globulins)."},
16:{n:"Albumin (Blood)",s:"Assesses nutritional status and liver/kidney function."},
17:{n:"HbA1c (Glycated Hemoglobin)",s:"Reflects blood sugar control over the last 3 months."},
18:{n:"Amylase",s:"Pancreatic enzyme, useful when pancreatitis is suspected."},
19:{n:"Lipase",s:"Pancreas-specific enzyme, more reliable than amylase."},
20:{n:"Oral Glucose Tolerance Test (OGTT)",s:"Screens for gestational diabetes and pre-diabetes."},
21:{n:"Serum Iron",s:"Assesses iron reserves, useful for anemia screening."},
22:{n:"Ferritin",s:"Best marker of the body's iron reserves."},
23:{n:"Transferrin",s:"Iron transport protein, completes the iron panel."},
24:{n:"CPK (Creatine Phosphokinase)",s:"Marker of muscle damage (heart or skeletal muscles)."},
25:{n:"Troponin (I or T)",s:"Specific marker of heart attack — cardiac emergency."},
26:{n:"LDH (Lactate Dehydrogenase)",s:"Non-specific marker of cell destruction (heart, liver, muscle, blood)."},
27:{n:"Arterial Blood Gas",s:"Measures blood oxygenation and acid-base balance."},
28:{n:"Blood Lactate",s:"Marker of tissue hypoxia and intense muscular effort."},
29:{n:"Total Cholesterol",s:"Can be requested alone, outside the complete lipid panel."},
30:{n:"Triglycerides",s:"Very sensitive to recent food intake — requires strict fasting."},
31:{n:"CBC (Complete Blood Count)",s:"Overall analysis of red cells, white cells and platelets."},
32:{n:"ESR (Erythrocyte Sedimentation Rate)",s:"Non-specific marker of inflammation or infection."},
33:{n:"Blood Typing ABO/Rh",s:"Determines blood group, required before transfusion or surgery."},
34:{n:"Reticulocytes",s:"Assesses the bone marrow's regeneration capacity."},
35:{n:"Blood Smear",s:"Microscopic examination of blood cell morphology."},
36:{n:"PT / INR (Prothrombin Time)",s:"Assesses coagulation, essential for anticoagulant monitoring."},
37:{n:"aPTT (Activated Partial Thromboplastin Time)",s:"Explores the intrinsic coagulation pathway."},
38:{n:"Fibrinogen",s:"Coagulation protein, inflammatory marker."},
39:{n:"D-Dimers",s:"Screening for deep vein thrombosis or pulmonary embolism."},
40:{n:"Hemoglobin Electrophoresis",s:"Screening for hemoglobinopathies (sickle cell, thalassemia)."},
41:{n:"Urine Culture (UTI test)",s:"Detects urinary infection — requires rigorous intimate hygiene."},
42:{n:"Throat Swab (Strep test)",s:"Detects group A beta-hemolytic streptococcus."},
43:{n:"Blood Culture",s:"Detects bacteria in the blood — ideally taken during a fever spike."},
44:{n:"Vaginal Swab",s:"Detects vaginal infections (yeast, vaginosis, STIs)."},
45:{n:"Stool Culture",s:"Detects intestinal pathogenic bacteria (Salmonella, Shigella...)."},
46:{n:"Wound / Pus Swab",s:"Identifies the bacteria responsible for a skin infection."},
47:{n:"Nasal Swab",s:"Detects bacterial carriage (S. aureus) or respiratory infection."},
48:{n:"Sputum Culture",s:"Detects bacterial lung infection."},
49:{n:"TB Test (Sputum smear for tuberculosis)",s:"Screening for pulmonary tuberculosis via sputum examination."},
50:{n:"Urine Culture in Pregnancy",s:"Monthly systematic screening for asymptomatic bacteriuria."},
51:{n:"TSH (Thyroid Stimulating Hormone)",s:"First-line screening test for thyroid disorders."},
52:{n:"Free T3 / T4",s:"Active thyroid hormones, complements the TSH panel."},
53:{n:"Prolactin",s:"Hormone linked to lactation, excess can cause infertility."},
54:{n:"FSH / LH",s:"Reproductive hormones, explore fertility and menopause."},
55:{n:"Estradiol",s:"Main female hormone, fertility and menopause monitoring."},
56:{n:"Progesterone",s:"Hormone confirming ovulation, early pregnancy monitoring."},
57:{n:"Testosterone",s:"Main male hormone, explores hirsutism and infertility."},
58:{n:"Cortisol",s:"Stress hormone, explores adrenal function."},
59:{n:"Insulin (Blood)",s:"Measures insulin, useful to explore insulin resistance."},
60:{n:"PTH (Parathyroid Hormone)",s:"Regulates calcium, explores parathyroid gland disorders."},
61:{n:"Beta-hCG (Blood Pregnancy Test)",s:"Confirms pregnancy more precisely than a urine test."},
62:{n:"AMH (Anti-Müllerian Hormone)",s:"Assesses ovarian reserve, useful in fertility work-up."},
63:{n:"Rheumatoid Factor (RF)",s:"Screening for rheumatoid arthritis."},
64:{n:"Antinuclear Antibodies (ANA)",s:"Screening for lupus and other systemic autoimmune diseases."},
65:{n:"Anti-CCP Antibodies",s:"Very specific marker of rheumatoid arthritis."},
66:{n:"Complement (C3, C4)",s:"Immune system proteins, useful in lupus monitoring."},
67:{n:"Total IgE",s:"Marker of allergy and parasitic infections."},
68:{n:"IgG, IgA, IgM Levels",s:"Assesses the body's humoral immune defenses."},
69:{n:"HIV Test (Screening)",s:"Detects HIV infection, performed confidentially."},
70:{n:"Hepatitis B Test (HBsAg)",s:"Detects the surface antigen of the hepatitis B virus."},
71:{n:"Hepatitis C Test (Anti-HCV)",s:"Detects antibodies against the hepatitis C virus."},
72:{n:"Toxoplasmosis Test",s:"Systematic screening for non-immune pregnant women."},
73:{n:"Rubella Test",s:"Checks immunity against rubella, essential in early pregnancy."},
74:{n:"Syphilis Test (TPHA-VDRL)",s:"Detects syphilis, mandatory in prenatal work-up."},
75:{n:"CMV Test (Cytomegalovirus)",s:"Screening during pregnancy or before organ transplant."},
76:{n:"Brucellosis Test (Wright Test)",s:"Detects brucellosis, common in Algeria (livestock contact, raw milk)."},
77:{n:"Hepatitis A Test (Anti-HAV)",s:"Checks immunity against hepatitis A ('dirty hands' disease)."},
78:{n:"Stool Parasite Exam",s:"Detects intestinal parasites (worms, amoebas, giardia)."},
79:{n:"Scotch Test (Pinworm Test)",s:"Simple test to detect pinworms, common in children."},
80:{n:"Thick Blood Smear (Malaria Test)",s:"Malaria screening, essential after travel to endemic areas."},
81:{n:"Giardia intestinalis Test",s:"Common parasite causing chronic diarrhea and digestive issues."},
82:{n:"Hydatid Cyst Test",s:"Detects hydatid cyst, common in Algeria (dog/sheep contact)."},
83:{n:"Vitamin B12",s:"Deficiency screening, common cause of anemia and neurological issues."},
84:{n:"Folic Acid (Vitamin B9)",s:"Essential during pregnancy, prevents fetal malformations."},
85:{n:"Vitamin D (25-OH)",s:"Very common deficiency in Algeria despite sunshine — lifestyle-related."},
86:{n:"Complete Iron Panel",s:"Full assessment of the body's iron status."},
87:{n:"Complete Liver Panel",s:"Combines liver enzymes, bilirubin, GGT, ALP to assess the liver."},
88:{n:"Complete Kidney Panel",s:"Fully assesses kidney function."},
89:{n:"24-Hour Urine Protein",s:"Precise measurement of protein loss in urine over a full day."},
90:{n:"Microalbuminuria",s:"Early detection of kidney complications from diabetes/hypertension."},
91:{n:"Creatinine Clearance (24h urine)",s:"Precise measurement of kidney filtration function."},
92:{n:"Standard Pre-Operative Panel",s:"Set of tests requested before any surgical procedure."},
93:{n:"Blood Osmolarity",s:"Assesses the body's water balance."},
94:{n:"Blood Lead Level",s:"Lead poisoning screening, especially in exposed occupations."},
95:{n:"Cholinesterase",s:"Marker of liver synthesis and pesticide poisoning monitoring."},
96:{n:"Platelet Count (isolated)",s:"Checks platelet levels, often for treatment monitoring."},
97:{n:"Direct Coombs Test",s:"Screening for autoimmune hemolytic anemia."},
98:{n:"Irregular Antibody Screening (IAS)",s:"Mandatory before transfusion and routine during pregnancy."},
99:{n:"Bone Marrow Aspiration",s:"Bone marrow examination, performed in specialized hospitals."},
100:{n:"Sickling Test (Sickle Cell Disease)",s:"Screening for sickle cell disease, particularly relevant in Algeria."},
101:{n:"Bleeding Time",s:"Assesses platelet function during bleeding."},
102:{n:"Antithrombin III",s:"Explores unexplained and recurrent thromboses."},
103:{n:"Protein C and Protein S",s:"Thrombophilia panel, searches for genetic clot causes."},
104:{n:"Ear Swab (Otitis)",s:"Bacterial identification for complicated or recurrent ear infection."},
105:{n:"Eye Swab (Conjunctivitis)",s:"Identifies the bacterial cause of persistent conjunctivitis."},
106:{n:"Urethral Swab (Male)",s:"Detects sexually transmitted infection (gonorrhea, chlamydia)."},
107:{n:"H. pylori Stool Antigen Test",s:"Non-invasive test for the bacteria causing stomach ulcers."},
108:{n:"Skin Scraping (Fungal Test)",s:"Detects fungi responsible for skin infections."},
109:{n:"Addis Count (HLM)",s:"Quantifies red/white cells in urine over a precise time span."},
110:{n:"TB Test in Urine",s:"Screening for urogenital tuberculosis."},
111:{n:"Urine Dipstick (Glucose & Ketones)",s:"Quick screening test, useful for diabetics and pregnant women."},
112:{n:"Semen Culture",s:"Detects infection in semen, in case of infertility or pain."},
113:{n:"Semen Analysis (Spermogram)",s:"Complete analysis of sperm quality, male fertility work-up."},
114:{n:"C-Peptide",s:"Assesses residual insulin secretion by the pancreas."},
115:{n:"Anti-TPO Antibodies (Thyroid)",s:"Screening for autoimmune thyroiditis (Hashimoto's)."},
116:{n:"SHBG (Sex Hormone Binding Globulin)",s:"Completes the hyperandrogenism panel in women."},
117:{n:"17-OH Progesterone",s:"Screening for congenital adrenal hyperplasia."},
118:{n:"DHEA-S",s:"Adrenal hormone, explores hyperandrogenism."},
119:{n:"ACTH (Adrenocorticotropic Hormone)",s:"Explores the hypothalamic-pituitary-adrenal axis."},
120:{n:"Growth Hormone (GH)",s:"Explores growth disorders in children."},
121:{n:"IGF-1 (Somatomedin C)",s:"Indirect and stable reflection of growth hormone secretion."},
122:{n:"Newborn Screening (Guthrie Test)",s:"Systematic screening for metabolic diseases in newborns."},
123:{n:"Neonatal Thyroid Screening (TSH)",s:"Systematic screening for congenital hypothyroidism."},
124:{n:"Entamoeba histolytica Test",s:"Detects intestinal amoebiasis, cause of dysentery."},
125:{n:"Leishmaniasis Test",s:"Detects leishmaniasis, transmitted by sandfly bites."},
126:{n:"Schistosomiasis Test",s:"Screening for those who traveled to endemic areas."},
127:{n:"Cryptosporidium Test",s:"Parasite causing severe diarrhea, especially in the immunocompromised."},
128:{n:"EBV Test (Infectious Mononucleosis)",s:"Detects mononucleosis, the 'kissing disease'."},
129:{n:"Pertussis Test (Whooping Cough)",s:"Detects Bordetella pertussis infection."},
130:{n:"Chlamydia trachomatis Test",s:"Screening for a common sexually transmitted infection."},
131:{n:"Chlamydia/Gonorrhea PCR",s:"Highly sensitive molecular STI test, on urine or swab."},
132:{n:"Anti-native DNA Antibodies",s:"Specific marker of systemic lupus erythematosus."},
133:{n:"Anti-Thyroglobulin Antibodies",s:"Completes the autoimmune thyroiditis panel."},
134:{n:"Anti-Gliadin / Anti-Transglutaminase Antibodies",s:"Screening for celiac disease (gluten intolerance)."},
135:{n:"Anti-Mitochondrial Antibodies",s:"Screening for primary biliary cirrhosis."},
136:{n:"Multi-Resistant Bacteria Carriage Screening",s:"Screening before hospitalization, especially in ICU."},
137:{n:"Catheter Tip Culture",s:"Detects catheter infection, performed in hospital settings."},
138:{n:"Urea Breath Test (H. pylori)",s:"Non-invasive breath test to detect Helicobacter pylori."},
139:{n:"Hydrogen Breath Test (Lactose Intolerance)",s:"Screening for lactose or fructose intolerance."},
140:{n:"PSA (Prostate Specific Antigen)",s:"Screening and monitoring of prostate conditions in men."},
141:{n:"CA 125 (Ovarian Marker)",s:"Monitoring marker, especially in ovarian cancer."},
142:{n:"CA 19-9 (Digestive Marker)",s:"Monitoring marker for digestive cancers (pancreas, bile ducts)."},
143:{n:"CEA (Carcinoembryonic Antigen)",s:"Monitoring marker, especially colorectal cancer."},
144:{n:"Alpha-fetoprotein (AFP)",s:"Marker for liver cancer and prenatal screening."},
145:{n:"Serum Zinc",s:"Trace element important for immunity and wound healing."},
146:{n:"Serum Copper",s:"Useful for screening Wilson's disease."},
147:{n:"Ceruloplasmin",s:"Copper transport protein, Wilson's disease screening."},
148:{n:"Homocysteine",s:"Cardiovascular risk marker, linked to B9/B12 deficiencies."},
149:{n:"Procalcitonin (PCT)",s:"Marker of severe bacterial infection, guides antibiotic therapy."},
150:{n:"Complete Pre-Transfusion Panel",s:"Set of mandatory tests before any blood transfusion."},
151:{n:"Lumbar Puncture (CSF Analysis)",s:"Cerebrospinal fluid analysis, performed as a hospital emergency."},
152:{n:"Serum Protein Electrophoresis",s:"Detailed analysis of blood proteins, screens for abnormal spikes."},
153:{n:"Haptoglobin",s:"Marker of hemolysis (red blood cell destruction)."},
154:{n:"Osmotic Fragility Test",s:"Screening for hereditary spherocytosis."},
155:{n:"Lupus Anticoagulant",s:"Thrombophilia and recurrent miscarriage work-up."},
156:{n:"Factor V Leiden Mutation",s:"Genetic test for hereditary thrombophilia."},
157:{n:"Urine Cytology",s:"Detects abnormal cells in urine."},
158:{n:"Urinary Stone Analysis",s:"Chemical analysis of an expelled or removed urinary stone."},
159:{n:"24h Urinary Uric Acid",s:"Assesses urinary elimination of uric acid."},
160:{n:"Trichinellosis Test",s:"Screening after eating undercooked meat."},
161:{n:"Fascioliasis Test (Liver Fluke)",s:"Screening after eating contaminated wild watercress."},
162:{n:"Tapeworm Test (Taenia)",s:"Screening for tapeworm after eating raw meat."},
163:{n:"First Trimester Combined Screening",s:"Screening for trisomy 21, combined with ultrasound."},
164:{n:"1st Trimester Prenatal Panel",s:"Set of mandatory tests in early pregnancy in Algeria."},
165:{n:"6th Month Prenatal Panel",s:"Mandatory check-up in the 3rd trimester of pregnancy in Algeria."},
166:{n:"Throat Swab — Candida Test",s:"Detects oral thrush, common in infants."},
167:{n:"Peri-anal Swab (Streptococcus)",s:"Detects group A strep infection in children."},
168:{n:"Joint Aspiration (Synovial Fluid)",s:"Analysis of joint fluid, screens for infection or crystals."},
169:{n:"Digoxin Level",s:"Therapeutic monitoring of a narrow-margin heart medication."},
170:{n:"Lithium Level",s:"Therapeutic monitoring of lithium, a psychiatric treatment."},
171:{n:"Carbamazepine Level",s:"Therapeutic monitoring of an anti-epileptic drug."},
172:{n:"Valproate Level (Depakine)",s:"Therapeutic monitoring of an anti-epileptic/mood stabilizer."},
173:{n:"Vancomycin Level",s:"Therapeutic monitoring of a narrow-margin antibiotic in hospital."},
174:{n:"HLA B27 Typing",s:"Genetic test associated with spondyloarthropathies."},
175:{n:"Blood Ammonia (Ammonemia)",s:"Explores hepatic encephalopathy and certain metabolic diseases."},
176:{n:"Porphyria Panel",s:"Screening for rare metabolic diseases affecting heme synthesis."},
177:{n:"Varicella-Zoster Test (VZV)",s:"Checks immunity against chickenpox, important in pregnancy."},
178:{n:"Measles Test",s:"Checks immunity against measles."},
179:{n:"Mumps Test",s:"Checks immunity against mumps."},
180:{n:"COVID-19 Antibody Test",s:"Detects antibodies following infection or vaccination."},
181:{n:"COVID-19 PCR Test",s:"Direct diagnostic test for active SARS-CoV-2 infection."},
182:{n:"Calcitonin",s:"Marker for medullary thyroid cancer."},
183:{n:"Renin and Aldosterone",s:"Explores hypertension of adrenal origin."},
184:{n:"Urinary/Blood Metanephrines",s:"Screening for pheochromocytoma, a rare adrenal tumor."},
185:{n:"Lipid Panel in Children",s:"Early screening for familial dyslipidemia."},
186:{n:"Liver Panel in Pregnancy (Cholestasis)",s:"Screening for pregnancy cholestasis, cause of intense itching."},
187:{n:"Bile Acids (Pregnancy)",s:"Confirms the diagnosis of pregnancy cholestasis."},
188:{n:"Iron Panel in Infants",s:"Screening for iron-deficiency anemia in infants, common in Algeria."},
189:{n:"Thyroid Panel in Pregnancy",s:"Thyroid monitoring adapted to pregnancy needs."},
190:{n:"Gestational Diabetes Screening (OGTT 75g)",s:"Standard test for gestational diabetes at 24-28 weeks."},
191:{n:"Pre-Delivery Coagulation Panel",s:"Systematic check before delivery or C-section."},
192:{n:"CBC in Pregnancy",s:"Monitoring pregnancy anemia, very common in Algeria."},
193:{n:"Vitamin A Level",s:"Assesses vitamin A status."},
194:{n:"Vitamin E Level",s:"Antioxidant, useful test in digestive malabsorption."},
195:{n:"Beta-2 Microglobulin",s:"Marker of kidney function and certain lymphoid conditions."},
196:{n:"Immunoreactive Trypsinogen (Newborn)",s:"Newborn screening for cystic fibrosis."},
197:{n:"Urinary Catecholamines",s:"Complementary work-up for pheochromocytoma, 24h urine."},
198:{n:"Zimmermann Test (17-Ketosteroids)",s:"Older but sometimes used test of adrenal function."},
199:{n:"TSH Receptor Antibodies (TRAb)",s:"Diagnosis of Graves' disease (autoimmune hyperthyroidism)."},
200:{n:"Plasma Renin Alone",s:"Component of the hypertension work-up (renal/adrenal origin)."},
201:{n:"Urine Culture in Children (Urine Bag)",s:"Adapted urine collection for infants not yet toilet-trained."},
};

const RELATED_TESTS = {
  // ── Metabolic / Diabetes ──
  1:  [17, 20, 59, 114],        // Glycémie à jeun → HbA1c, HGPO, Insulinémie, Peptide C
  17: [1, 20, 59],              // HbA1c → Glycémie, HGPO, Insulinémie
  20: [1, 17, 190],             // HGPO → Glycémie, HbA1c, HGPO grossesse
  59: [1, 17, 114],             // Insulinémie → Glycémie, HbA1c, Peptide C
  114:[1, 59, 17],              // Peptide C → Glycémie, Insulinémie, HbA1c
  190:[20, 1, 192],             // HGPO grossesse → HGPO, Glycémie, NFS grossesse

  // ── Lipids / Cardiovascular ──
  2:  [29, 30, 148, 185],       // Bilan lipidique → Cholestérol, Triglycérides, Homocystéine, Bilan lipidique enfant
  29: [2, 30],                  // Cholestérol total → Bilan lipidique, Triglycérides
  30: [2, 29, 148],             // Triglycérides → Bilan lipidique, Cholestérol, Homocystéine
  148:[2, 83, 84],              // Homocystéine → Bilan lipidique, Vit B12, Acide folique
  25: [24, 26, 9],              // Troponine → CPK, LDH, CRP
  24: [25, 26],                 // CPK → Troponine, LDH

  // ── Kidney / Renal ──
  3:  [4, 88, 91],              // Urée → Créatinine, Bilan rénal, Clairance
  4:  [3, 88, 91, 90],          // Créatinine → Urée, Bilan rénal, Clairance, Microalbuminurie
  88: [3, 4, 91, 90],           // Bilan rénal → Urée, Créatinine, Clairance, Microalbuminurie
  89: [90, 91],                 // Protéinurie 24h → Microalbuminurie, Clairance
  90: [89, 88, 4],              // Microalbuminurie → Protéinurie 24h, Bilan rénal, Créatinine
  91: [88, 4, 89],              // Clairance créatinine → Bilan rénal, Créatinine, Protéinurie

  // ── Liver ──
  5:  [6, 7, 8, 87],            // Transaminases → Bilirubine, PAL, GGT, Bilan hépatique
  6:  [5, 7, 8, 87],            // Bilirubine → Transaminases, PAL, GGT, Bilan hépatique
  7:  [5, 6, 8],                // PAL → Transaminases, Bilirubine, GGT
  8:  [5, 6, 7, 87],            // GGT → Transaminases, Bilirubine, PAL, Bilan hépatique
  87: [5, 6, 7, 8],             // Bilan hépatique complet → all liver enzymes

  // ── Thyroid ──
  51: [52, 115, 199, 133, 189], // TSH → T3/T4, Anti-TPO, TRAK, Anti-thyroglobuline, TSH grossesse
  52: [51, 115],                // T3/T4 libres → TSH, Anti-TPO
  115:[51, 52, 133],            // Anti-TPO → TSH, T3/T4, Anti-thyroglobuline
  133:[51, 115],                // Anti-thyroglobuline → TSH, Anti-TPO
  199:[51, 52],                 // TRAK → TSH, T3/T4
  189:[51, 52, 192],            // TSH grossesse → TSH, T3/T4, NFS grossesse

  // ── Iron / Anemia ──
  21: [22, 23, 86],             // Fer sérique → Ferritine, Transferrine, Bilan martial
  22: [21, 23, 86, 188],        // Ferritine → Fer, Transferrine, Bilan martial, Bilan martial nourrisson
  23: [21, 22, 86],             // Transferrine → Fer, Ferritine, Bilan martial
  86: [21, 22, 23],             // Bilan martial complet → Fer, Ferritine, Transferrine
  31: [96, 34, 192],            // NFS → Plaquettes, Réticulocytes, NFS grossesse
  188:[22, 21],                 // Bilan martial nourrisson → Ferritine, Fer

  // ── Urology / UTI ──
  41: [50, 109, 201, 110],      // ECBU → ECBU grossesse, Addis, ECBU enfant, BK urines
  50: [41, 192],                // ECBU grossesse → ECBU, NFS grossesse
  109:[41, 110],                // Compte Addis → ECBU, BK urines
  201:[41, 50],                 // ECBU enfant → ECBU, ECBU grossesse
  112:[113],                    // Spermoculture → Spermogramme
  113:[112],                    // Spermogramme → Spermoculture

  // ── Coagulation ──
  36: [37, 38, 39, 191],        // TP/INR → TCA, Fibrinogène, D-Dimères, Bilan pré-accouchement
  37: [36, 38],                 // TCA → TP/INR, Fibrinogène
  38: [36, 37],                 // Fibrinogène → TP/INR, TCA
  39: [36, 155],                // D-Dimères → TP/INR, Anticoagulant circulant
  102:[103, 156],               // Antithrombine III → Protéine C/S, Facteur V Leiden
  103:[102, 156, 155],          // Protéine C/S → Antithrombine III, Facteur V Leiden, Anticoagulant circulant

  // ── Hormones — reproductive ──
  54: [55, 56, 57, 62],         // FSH/LH → Œstradiol, Progestérone, Testostérone, AMH
  55: [54, 56, 62],             // Œstradiol → FSH/LH, Progestérone, AMH
  56: [54, 55, 61],             // Progestérone → FSH/LH, Œstradiol, Beta-hCG
  57: [54, 116, 118],           // Testostérone → FSH/LH, SHBG, DHEA-S
  116:[57, 118, 117],           // SHBG → Testostérone, DHEA-S, 17-OH Progestérone
  118:[57, 116, 117],           // DHEA-S → Testostérone, SHBG, 17-OH Progestérone
  61: [56, 163],                // Beta-hCG → Progestérone, Triple test
  62: [54, 55],                 // AMH → FSH/LH, Œstradiol

  // ── Adrenal / Stress hormones ──
  58: [119, 183, 184],          // Cortisol → ACTH, Rénine/Aldostérone, Métanéphrines
  119:[58],                     // ACTH → Cortisol
  183:[184, 200],               // Rénine/Aldostérone → Métanéphrines, Rénine seule
  184:[183, 197],               // Métanéphrines → Rénine/Aldostérone, Catécholamines urinaires
  197:[184],                    // Catécholamines urinaires → Métanéphrines
  200:[183],                    // Rénine seule → Rénine/Aldostérone

  // ── Inflammation / Infection markers ──
  9:  [32, 149, 25],            // CRP → VS, Procalcitonine, Troponine
  32: [9, 149],                 // VS → CRP, Procalcitonine
  149:[9, 32],                  // Procalcitonine → CRP, VS

  // ── Autoimmune / Rheumatology ──
  63: [64, 65, 132, 174],       // Facteur Rhumatoïde → AAN, Anti-CCP, Anti-DNA, HLA B27
  64: [63, 65, 132],            // AAN → FR, Anti-CCP, Anti-DNA
  65: [63, 64],                 // Anti-CCP → FR, AAN
  132:[64, 66],                 // Anti-DNA → AAN, Complément
  66: [132, 64],                // Complément C3/C4 → Anti-DNA, AAN

  // ── Vitamins ──
  83: [84, 148, 31],            // Vitamine B12 → Acide folique, Homocystéine, NFS
  84: [83, 148],                // Acide folique → Vitamine B12, Homocystéine
  85: [11, 60],                 // Vitamine D → Calcémie, PTH

  // ── Calcium / Bone ──
  11: [60, 85, 13],             // Calcémie → PTH, Vitamine D, Phosphorémie
  60: [11, 85],                 // PTH → Calcémie, Vitamine D
  13: [11, 60],                 // Phosphorémie → Calcémie, PTH

  // ── Prenatal / Pregnancy ──
  164:[165, 190, 192, 61, 72, 73, 74],  // Bilan prénatal T1 → Bilan T6, HGPO grossesse, NFS grossesse, Beta-hCG, Toxo, Rubéole, Syphilis
  165:[164, 190, 98],           // Bilan prénatal 6e mois → Bilan T1, HGPO grossesse, RAI
  72: [73, 74, 164],            // Toxoplasmose → Rubéole, Syphilis, Bilan prénatal
  73: [72, 74, 164],            // Rubéole → Toxoplasmose, Syphilis, Bilan prénatal
  74: [72, 73, 164],            // Syphilis → Toxoplasmose, Rubéole, Bilan prénatal
  186:[187, 5],                 // Cholestase gravidique → Acides biliaires, Transaminases
  187:[186],                    // Acides biliaires → Cholestase gravidique
  163:[61, 164],                // Triple test → Beta-hCG, Bilan prénatal

  // ── Infectious serology bundle ──
  69: [70, 71, 74],             // VIH → Hépatite B, Hépatite C, Syphilis
  70: [69, 71, 77],             // Hépatite B → VIH, Hépatite C, Hépatite A
  71: [69, 70],                 // Hépatite C → VIH, Hépatite B
  77: [70, 71],                 // Hépatite A → Hépatite B, Hépatite C

  // ── Parasitology ──
  78: [79, 124, 81],            // EPS → Scotch test, Amibiase, Giardia
  124:[78, 81],                 // Amibiase → EPS, Giardia
  81: [78, 124],                // Giardia → EPS, Amibiase

  // ── Tumor markers ──
  140:[141, 142, 143],          // PSA → CA 125, CA 19-9, ACE (panel awareness, not clinical equivalence)
  141:[140, 142],               // CA 125 → PSA, CA 19-9
  144:[140],                    // AFP → PSA
};

/* ═══════════════════════════════════════════════════════════════
   "EXPLAIN LIKE I'M SCARED" — CALM MODE
   Curated, gentler framing for the tests most likely to worry an
   anxious patient (needles, biopsy-adjacent procedures, lumbar
   puncture, etc). Only the tests listed here have a hand-written
   calm version — for any other test, calm mode shows a generic
   reassurance banner instead of a fake personalized one.
   ═══════════════════════════════════════════════════════════════ */
const CALM_MODE_CONTENT = {
  // Blood draws in general (very common anxiety trigger)
  1:  { fr: "C'est juste une petite piqûre au bras, comme un pincement bref — ça dure quelques secondes et c'est fini. Le personnel du laboratoire fait ça toute la journée, en toute sécurité.",
        ar: "الأمر مجرد وخزة صغيرة في الذراع، مثل قرصة خفيفة — تستغرق ثوانٍ معدودة وتنتهي بسرعة. طاقم المخبر يقوم بهذا يومياً وبأمان تام.",
        en: "It's just a small pinch in your arm, like a brief poke — it lasts a few seconds and it's over. The lab staff does this safely, all day, every day." },
  // Lumbar puncture — one of the most feared procedures
  151:{ fr: "Cet examen fait souvent peur mais il est réalisé avec une anesthésie locale, donc vous ne sentirez qu'une légère pression, pas de douleur vive. Le médecin vous expliquera chaque étape avant de commencer, et vous pouvez toujours demander une pause.",
        ar: "هذا الفحص يخيف الكثيرين لكنه يُجرى بتخدير موضعي، لذا ستشعر فقط بضغط خفيف وليس ألماً حاداً. سيشرح لك الطبيب كل خطوة قبل البدء، ويمكنك دائماً طلب توقف مؤقت.",
        en: "This test often sounds scary, but it's done with local anesthesia — you'll only feel light pressure, not sharp pain. The doctor will explain each step before starting, and you can always ask for a pause." },
  // Bone marrow aspiration
  99: { fr: "Vous recevrez une anesthésie locale avant le geste, donc la douleur est très limitée — souvent juste une sensation de pression pendant quelques secondes. L'équipe médicale est habituée à accompagner les patients anxieux, n'hésitez pas à leur en parler.",
        ar: "ستحصل على تخدير موضعي قبل الإجراء، لذا الألم محدود جداً — غالباً مجرد شعور بالضغط لثوانٍ معدودة. الطاقم الطبي معتاد على مرافقة المرضى القلقين، لا تتردد في إخبارهم.",
        en: "You'll get local anesthesia before the procedure, so the pain is very limited — often just a feeling of pressure for a few seconds. The medical team is used to supporting anxious patients, so feel free to tell them how you're feeling." },
  // Arterial blood gas — known to be more uncomfortable than a regular draw
  27: { fr: "Cette prise de sang est un peu plus sensible qu'une prise de sang classique, mais elle est très rapide — quelques secondes seulement. Respirer lentement pendant le geste aide beaucoup à se détendre.",
        ar: "أخذ عينة الدم هذه أكثر حساسية قليلاً من أخذ الدم العادي، لكنها سريعة جداً — ثوانٍ معدودة فقط. التنفس ببطء أثناء الإجراء يساعد كثيراً على الاسترخاء.",
        en: "This blood draw is a bit more sensitive than a regular one, but it's very quick — just a few seconds. Breathing slowly during the procedure really helps you relax." },
  // Joint aspiration
  168:{ fr: "Le médecin désinfecte et parfois anesthésie localement la zone avant de piquer, donc l'inconfort est généralement bref. Beaucoup de patients disent que l'appréhension est pire que la sensation réelle.",
        ar: "يقوم الطبيب بتعقيم المنطقة وأحياناً تخديرها موضعياً قبل الوخز، لذا الانزعاج يكون عادة قصيراً. يقول الكثير من المرضى إن القلق أسوأ من الشعور الفعلي.",
        en: "The doctor cleans and sometimes locally numbs the area before the needle, so the discomfort is usually brief. Many patients say the anticipation is worse than the actual sensation." },
  // Endoscopy-adjacent / breath tests (claustrophobia-adjacent anxiety)
  138:{ fr: "Pas d'aiguille ni d'inconfort ici — il suffit de souffler dans un petit sachet, comme gonfler un ballon doucement. C'est l'un des tests les plus simples et les moins stressants du laboratoire.",
        ar: "لا إبرة ولا انزعاج هنا — كل ما عليك فعله هو النفخ في كيس صغير، مثل نفخ بالون بلطف. إنه من أبسط وأقل الفحوصات إثارة للتوتر في المخبر.",
        en: "No needle, no discomfort here — you just breathe into a small bag, like gently blowing up a balloon. It's one of the simplest, least stressful tests in the whole lab." },
};

const CALM_MODE_GENERIC = {
  fr: "Cette analyse peut sembler impressionnante en la lisant, mais le personnel du laboratoire réalise ce geste très régulièrement, en toute sécurité. N'hésitez pas à leur poser vos questions ou à leur dire si vous êtes anxieux(se) — ils sont là pour vous rassurer.",
  ar: "قد يبدو هذا التحليل مقلقاً عند قراءته، لكن طاقم المخبر يقوم بهذا الإجراء بانتظام وبأمان تام. لا تتردد في طرح أسئلتك أو إخبارهم إذا كنت قلقاً — فهم هنا لطمأنتك.",
  en: "This test might sound intimidating when you read about it, but lab staff perform this procedure very routinely and safely. Don't hesitate to ask questions or tell them if you're feeling anxious — they're there to help put you at ease."
};

const CALM_TEXT = {
  fr: { toggleLabel: "Mode rassurant", toggleLabelActive: "Masquer le mode rassurant" },
  ar: { toggleLabel: "الوضع المطمئن", toggleLabelActive: "إخفاء الوضع المطمئن" },
  en: { toggleLabel: "Calm mode", toggleLabelActive: "Hide calm mode" }
};

function toggleCalmMode(testId) {
  const banner = document.getElementById('calm-banner-' + testId);
  const btn = document.getElementById('calm-toggle-' + testId);
  if (!banner || !btn) return;

  const isShowing = banner.style.display !== 'none';
  if (isShowing) {
    banner.style.display = 'none';
    btn.querySelector('span').textContent = CALM_TEXT[currentLang].toggleLabel;
    btn.classList.remove('active');
  } else {
    const contentLang = currentLang === 'en' ? 'en' : currentLang; // calm content has its own en, unlike the rest of the modal
    const entry = CALM_MODE_CONTENT[testId];
    const text = entry ? entry[contentLang] : CALM_MODE_GENERIC[contentLang];
    banner.innerHTML = `<i class="fa-solid fa-heart"></i><span>${text}</span>`;
    banner.style.display = 'flex';
    btn.querySelector('span').textContent = CALM_TEXT[currentLang].toggleLabelActive;
    btn.classList.add('active');
  }
}

UI.en = {
  tagline: "Medical Test Preparation Guide",
  heroTitle: "Get<br/><em>properly</em> prepared<br/>for your test",
  heroSub: "Type the name of any medical test — get instant, accurate preparation instructions for your lab in Algeria.",
  searchPlaceholder: "E.g: Fasting glucose, Urine culture, CBC...",
  langBtn: "FR",
  pillAll: "All",
  pillLabels: {
    biochimie:'Biochemistry', hematologie:'Hematology', bacteriologie:'Bacteriology',
    hormonologie:'Hormonology', immunologie:'Immunology', parasitologie:'Parasitology',
    urologie:'Urology', serologie:'Serology', coagulation:'Coagulation'
  },
  resultsFound: (n) => n + (n === 1 ? ' test found' : ' tests found'),
  emptyTitle: "No test found",
  emptySub: "Try another search term or category",
  fastingReq: (h) => `Fast ${h}h`,
  noFasting: "No fasting",
  ctaSee: "View details",
  modalPrep: "PREPARATION BEFORE THE TEST",
  modalSampling: "SAMPLE COLLECTION METHOD",
  modalMeds: "MEDICATIONS TO REPORT",
  modalNote: "GOOD TO KNOW",
  modalTubes: "REQUIRED TUBE(S)",
  modalFastingLabel: "Fasting required",
  readyBadgeText: "You're ready for this test!",
  footerDisclaimer: "This information is provided for guidance only. Always consult your doctor or lab staff for personalized instructions.",
  unit: "tests",
  favTitle: "My Favorite Tests", favEmpty: "No favorite tests yet", favEmptySub: "Tap the ⭐ on any card to save it here",
  timerTitle: "Fasting Timer", timerPick: "Choose fasting duration", timerStart: "Start fasting now",
  timerRemaining: "Remaining", timerDoneAt: "Ends at", timerCancel: "Cancel timer", timerDone: "Fasting complete! You can now go for your test",
  contentNote: "Note: full step-by-step details below are shown in French to ensure medical accuracy.",
};

/* ═══════════════════════════════════════════════════════════════
   RENDERING
   ═══════════════════════════════════════════════════════════════ */

function getName(item) {
  if (currentLang === 'en') return (EN_NAMES[item.id] && EN_NAMES[item.id].n) || item.name_fr;
  return currentLang === 'fr' ? item.name_fr : item.name_ar;
}
function getSummary(item) {
  if (currentLang === 'en') return (EN_NAMES[item.id] && EN_NAMES[item.id].s) || item.summary_fr;
  return currentLang === 'fr' ? item.summary_fr : item.summary_ar;
}
function getSecondaryName(item) {
  // shown as smaller subtitle line under the main title
  if (currentLang === 'en') return item.name_fr;
  return currentLang === 'fr' ? item.name_ar : item.name_fr;
}

function getFilteredResults() {
  const q = currentQuery.trim().toLowerCase();
  return DB.filter(item => {
    // category filter
    if (currentCat !== 'all' && item.cat !== currentCat) return false;
    // search filter
    if (!q) return true;
    const fr = item.name_fr.toLowerCase();
    const ar = item.name_ar;
    const en = ((EN_NAMES[item.id] && EN_NAMES[item.id].n) || '').toLowerCase();
    const summaryFr = item.summary_fr.toLowerCase();
    return fr.includes(q) || ar.includes(currentQuery.trim()) || summaryFr.includes(q) || en.includes(q);
  });
}

function renderCards() {
  const grid = document.getElementById('results-grid');
  const emptyState = document.getElementById('empty-state');
  const searchMeta = document.getElementById('search-meta');
  if (!grid) return;

  const results = getFilteredResults();
  const ui = UI[currentLang];

  grid.innerHTML = '';

  if (results.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    document.getElementById('empty-title').textContent = ui.emptyTitle;
    document.getElementById('empty-sub').textContent = ui.emptySub;
  } else {
    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    results.forEach(item => {
      const card = document.createElement('article');
      card.className = `analysis-card cat-${item.cat}`;
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');

      const isNoFast = item.fasting === 0;
      const fastLabel = isNoFast ? ui.noFasting : ui.fastingReq(item.fasting);
      const fastIcon = isNoFast ? 'fa-solid fa-check' : 'fa-solid fa-clock';

      const name = getName(item);
      const nameSecondary = getSecondaryName(item);
      const summary = getSummary(item);
      const isFav = favorites.includes(item.id);
      const isChecked = checklistItems.includes(item.id);

      const catIcon = {
        biochimie:'fa-solid fa-atom', hematologie:'fa-solid fa-droplet',
        bacteriologie:'fa-solid fa-bacteria', hormonologie:'fa-solid fa-circle-nodes',
        immunologie:'fa-solid fa-shield-virus', parasitologie:'fa-solid fa-viruses',
        urologie:'fa-solid fa-kidneys', serologie:'fa-solid fa-syringe',
        coagulation:'fa-solid fa-heart-pulse'
      }[item.cat] || 'fa-solid fa-flask';

      const tubeDots = item.tubes.map(t => `<span class="tube-dot" style="background:${t.c}" title="${currentLang==='ar'?t.n_ar:t.n_fr}"></span>`).join('');

      card.innerHTML = `
        <button class="card-checklist-box ${isChecked ? 'active' : ''}" data-id="${item.id}" aria-label="checklist" title="checklist">
          <i class="fa-solid fa-check"></i>
        </button>
        <button class="card-fav-star ${isFav ? 'active' : ''}" data-id="${item.id}" aria-label="favorite" title="favorite">
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
        </button>
        <div class="card-top">
          <div class="card-icon"><i class="${catIcon}"></i></div>
          <div class="card-badges">
            <span class="cat-badge">${ui.pillLabels[item.cat]}</span>
            <span class="fasting-badge ${isNoFast ? 'no-fast' : ''}"><i class="${fastIcon}"></i>${fastLabel}</span>
          </div>
        </div>
        <h3 class="card-title">${name}</h3>
        <p class="card-title-ar">${nameSecondary}</p>
        <p class="card-summary">${summary}</p>
        <div class="card-footer">
          <span class="card-cta">${ui.ctaSee}<i class="fa-solid ${currentLang==='ar' ? 'fa-arrow-left' : 'fa-arrow-right'}"></i></span>
          <div class="tube-indicator">${tubeDots}</div>
        </div>
      `;

      card.addEventListener('click', () => openModal(item.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item.id); }
      });

      const starBtn = card.querySelector('.card-fav-star');
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(item.id);
      });

      const checkBtn = card.querySelector('.card-checklist-box');
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleChecklistItem(item.id);
      });

      grid.appendChild(card);
    });
  }

  searchMeta.textContent = currentQuery.trim() ? ui.resultsFound(results.length) : '';
  document.getElementById('total-count').textContent = DB.length;
}

/* ═══════════════════════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════════════════════ */

/* ── "AM I READY?" PREP CHECKLIST STATE ──────────────────────────
   Per-test checkbox state for the prep-steps list inside the modal.
   Uses sessionStorage (not localStorage) on purpose: this should
   reset naturally between visits rather than silently show a stale
   "ready" state days later for a completely different appointment. */

function getPrepCheckState() {
  try { return JSON.parse(sessionStorage.getItem('labprepdz_prepcheck') || '{}'); }
  catch(e) { return {}; }
}
function isPrepStepChecked(testId, idx) {
  const state = getPrepCheckState();
  return !!(state[testId] && state[testId][idx]);
}
function setPrepStepChecked(testId, idx, checked) {
  const state = getPrepCheckState();
  if (!state[testId]) state[testId] = {};
  state[testId][idx] = checked;
  try { sessionStorage.setItem('labprepdz_prepcheck', JSON.stringify(state)); } catch(e) {}
}
function updateReadyBadge(testId, totalSteps) {
  const badge = document.getElementById('ready-badge-' + testId);
  if (!badge) return;
  const state = getPrepCheckState();
  const checkedCount = state[testId] ? Object.values(state[testId]).filter(Boolean).length : 0;
  badge.style.display = (checkedCount === totalSteps && totalSteps > 0) ? 'flex' : 'none';
}

function openModal(id) {
  const item = DB.find(d => d.id === id);
  if (!item) return;
  recentlyViewed = recentlyViewed.filter(rid => rid !== id);
recentlyViewed.unshift(id);
recentlyViewed = recentlyViewed.slice(0, 5);
localStorage.setItem('labprepdz_recent', JSON.stringify(recentlyViewed));
renderRecentStrip();
  const ui = UI[currentLang];
  const modalBody = document.getElementById('modal-body');
  const overlay = document.getElementById('modal-overlay');

  const name = getName(item);
  const nameSecondary = getSecondaryName(item);
  // Detailed protocol content: FR/AR shown natively; EN mode shows FR text (labeled) for medical accuracy
  const contentLang = currentLang === 'en' ? 'fr' : currentLang;
  const prep = contentLang === 'fr' ? item.prep_fr : item.prep_ar;
  const sampling = contentLang === 'fr' ? item.sampling_fr : item.sampling_ar;
  const meds = contentLang === 'fr' ? item.meds_fr : item.meds_ar;
  const note = contentLang === 'fr' ? item.note_fr : item.note_ar;

  const isNoFast = item.fasting === 0;
  const fastLabel = isNoFast ? ui.noFasting : ui.fastingReq(item.fasting);

  const tubesHTML = item.tubes.map(t => `
    <span class="tube-chip">
      <span class="tube-color" style="background:${t.c}"></span>
      ${contentLang === 'fr' ? t.n_fr : t.n_ar}
    </span>
  `).join('');

  const enNoteHTML = currentLang === 'en' ? `<p class="modal-text" style="opacity:0.65;font-style:italic;margin-bottom:14px;font-size:0.78rem">${ui.contentNote}</p>` : '';

  const prepHTML = prep.map((p, i) => `
    <li class="prep-check-item" data-idx="${i}">
      <label>
        <input type="checkbox" class="prep-checkbox" data-test-id="${item.id}" data-idx="${i}" ${isPrepStepChecked(item.id, i) ? 'checked' : ''}/>
        <span class="prep-check-text">${p}</span>
      </label>
    </li>
  `).join('');
  const samplingHTML = sampling.map(s => `<li>${s}</li>`).join('');
  const medsHTML = meds.map(m => `<li>${m}</li>`).join('');

  const catBg = {
    biochimie:'#f0fdfa', hematologie:'#fee2e2', bacteriologie:'#ede9fe',
    hormonologie:'#fef3c7', immunologie:'#dbeafe', parasitologie:'#dcfce7',
    urologie:'#e0f2fe', serologie:'#f3e8ff', coagulation:'#fef9c3'
  }[item.cat] || '#f0fdfa';
  const catColor = {
    biochimie:'#0d9488', hematologie:'#dc2626', bacteriologie:'#7c3aed',
    hormonologie:'#d97706', immunologie:'#1e40af', parasitologie:'#15803d',
    urologie:'#0369a1', serologie:'#9333ea', coagulation:'#b45309'
  }[item.cat] || '#0d9488';

  // "Similar tests" block — computed here as a plain string,
  // then referenced via ${relatedHTML} inside the modal template below.
  const related = RELATED_TESTS[item.id] || [];
  const relatedLabel = currentLang==='ar' ? 'تحاليل مشابهة' : (currentLang==='en' ? 'Similar tests' : 'Analyses similaires');
  const relatedHTML = related.length > 0 ? `
    <div class="modal-section info">
      <div class="modal-section-title"><i class="fa-solid fa-diagram-project"></i>${relatedLabel}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${related.map(rid => {
          const r = DB.find(d => d.id === rid);
          return r ? `<button class="recent-chip" style="background:var(--teal-pale);color:var(--teal-dark);border-color:var(--teal-light)" onclick="openModal(${rid})">${getName(r)}</button>` : '';
        }).join('')}
      </div>
    </div>
  ` : '';

  modalBody.innerHTML = `
    <div class="modal-header">
      <span class="modal-cat-badge" style="background:${catBg};color:${catColor}">${ui.pillLabels[item.cat]}</span>
      <h2 class="modal-title">${name}</h2>
      <p class="modal-title-ar">${nameSecondary}</p>
    <div class="tube-row">${tubesHTML}</div>
<div style="display:flex;gap:8px;margin-top:12px">
  <button class="print-btn" onclick="window.print()">
    <i class="fa-solid fa-print"></i> ${currentLang==='ar'?'طباعة':(currentLang==='en'?'Print':'Imprimer')}
  </button>
  <button class="print-btn" onclick="shareTest(${item.id})">
    <i class="fa-brands fa-whatsapp"></i> ${currentLang==='ar'?'مشاركة':(currentLang==='en'?'Share':'Partager')}
  </button>
  <button class="print-btn" onclick="openReminderModal(${item.id})">
    <i class="fa-solid fa-bell"></i> ${currentLang==='ar'?'تذكير':(currentLang==='en'?'Reminder':'Rappel')}
  </button>
</div>
</div>

    <div class="modal-important">
      <i class="fa-solid fa-clock"></i>
      <span><strong>${ui.modalFastingLabel}:</strong> ${fastLabel}</span>
    </div>

    <button class="calm-toggle-btn" id="calm-toggle-${item.id}" onclick="toggleCalmMode(${item.id})">
      <i class="fa-solid fa-heart-circle-check"></i>
      <span>${CALM_TEXT[currentLang].toggleLabel}</span>
    </button>
    <div id="calm-banner-${item.id}" class="calm-banner" style="display:none"></div>

    ${enNoteHTML}

    <div class="modal-section warning">
      <div class="modal-section-title"><i class="fa-solid fa-list-check"></i>${ui.modalPrep}</div>
      <ul class="modal-list prep-check-list" id="prep-check-list-${item.id}">${prepHTML}</ul>
      <div class="ready-badge" id="ready-badge-${item.id}" style="display:none">
        <i class="fa-solid fa-circle-check"></i>
        <span>${ui.readyBadgeText}</span>
      </div>
    </div>

    <div class="modal-section info">
      <div class="modal-section-title"><i class="fa-solid fa-vial-circle-check"></i>${ui.modalSampling}</div>
      <ul class="modal-list">${samplingHTML}</ul>
    </div>

    <div class="modal-section danger">
      <div class="modal-section-title"><i class="fa-solid fa-pills"></i>${ui.modalMeds}</div>
      <ul class="modal-list">${medsHTML}</ul>
    </div>

    <div class="modal-section success">
      <div class="modal-section-title"><i class="fa-solid fa-lightbulb"></i>${ui.modalNote}</div>
      <p class="modal-text">${note}</p>
    </div>

    ${relatedHTML}
  `;

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Wire up "Am I ready?" prep checkboxes
  modalBody.querySelectorAll('.prep-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const testId = parseInt(cb.getAttribute('data-test-id'), 10);
      const idx = parseInt(cb.getAttribute('data-idx'), 10);
      setPrepStepChecked(testId, idx, cb.checked);
      updateReadyBadge(testId, prep.length);
    });
  });
  updateReadyBadge(item.id, prep.length);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
}
function shareTest(id) {
  const item = DB.find(d => d.id === id);
  if (!item) return;
  const name = getName(item);
  const contentLang = currentLang === 'en' ? 'fr' : currentLang;
  const prep = contentLang === 'fr' ? item.prep_fr : item.prep_ar;
  const text = `${name}\n\n` + prep.map((p,i) => `${i+1}. ${p}`).join('\n') + `\n\n LabPrep DZ`;

  if (navigator.share) {
    navigator.share({ title: name, text: text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert(currentLang==='ar' ? 'تم النسخ!' : (currentLang==='en' ? 'Copied!' : 'Copié !'));
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP REMINDER TEMPLATE
   Lets the patient (or a family member managing the appointment)
   pick an appointment date/time, and generates a ready-to-send
   message with the fasting start time computed backward from it.
   ═══════════════════════════════════════════════════════════════ */

const REMINDER_TEXT = {
  fr: {
    title: 'Créer un rappel',
    intro: "Choisissez la date et l'heure du rendez-vous pour générer un message de rappel prêt à partager.",
    dateLabel: 'Date du rendez-vous',
    timeLabel: 'Heure du rendez-vous',
    nameLabel: 'Nom du patient (optionnel)',
    namePlaceholder: 'Ex: Maman, Grand-père...',
    generateBtn: 'Générer le message',
    sendBtn: 'Envoyer sur WhatsApp',
    copyBtn: 'Copier le message',
    copied: 'Copié !',
    msgReminder: (name, test, date, time) => `📋 Rappel de rendez-vous${name ? ' pour ' + name : ''}\n\n🧪 Analyse : ${test}\n📅 Date : ${date}\n🕐 Heure : ${time}`,
    msgFasting: (fh, fdate, ftime) => `\n\n⏱ Jeûne de ${fh}h à respecter — commencer le jeûne le ${fdate} à ${ftime} au plus tard.`,
    msgNoFasting: `\n\n✅ Aucun jeûne requis pour cette analyse.`,
    msgFooter: `\n\n— Généré via LabPrep DZ`,
  },
  ar: {
    title: 'إنشاء تذكير',
    intro: "اختر تاريخ ووقت الموعد لإنشاء رسالة تذكير جاهزة للمشاركة.",
    dateLabel: 'تاريخ الموعد',
    timeLabel: 'وقت الموعد',
    nameLabel: 'اسم المريض (اختياري)',
    namePlaceholder: 'مثال: أمي، جدي...',
    generateBtn: 'إنشاء الرسالة',
    sendBtn: 'إرسال عبر واتساب',
    copyBtn: 'نسخ الرسالة',
    copied: 'تم النسخ!',
    msgReminder: (name, test, date, time) => `📋 تذكير بموعد${name ? ' لـ ' + name : ''}\n\n🧪 التحليل: ${test}\n📅 التاريخ: ${date}\n🕐 الوقت: ${time}`,
    msgFasting: (fh, fdate, ftime) => `\n\n⏱ يجب الصيام ${fh} ساعات — ابدأ الصيام يوم ${fdate} الساعة ${ftime} على أبعد تقدير.`,
    msgNoFasting: `\n\n✅ لا يتطلب هذا التحليل الصيام.`,
    msgFooter: `\n\n— تم الإنشاء عبر LabPrep DZ`,
  },
  en: {
    title: 'Create a reminder',
    intro: "Pick the appointment date and time to generate a ready-to-share reminder message.",
    dateLabel: 'Appointment date',
    timeLabel: 'Appointment time',
    nameLabel: "Patient's name (optional)",
    namePlaceholder: 'E.g: Mom, Grandpa...',
    generateBtn: 'Generate message',
    sendBtn: 'Send via WhatsApp',
    copyBtn: 'Copy message',
    copied: 'Copied!',
    msgReminder: (name, test, date, time) => `📋 Appointment reminder${name ? ' for ' + name : ''}\n\n🧪 Test: ${test}\n📅 Date: ${date}\n🕐 Time: ${time}`,
    msgFasting: (fh, fdate, ftime) => `\n\n⏱ ${fh}h fasting required — start fasting by ${fdate} at ${ftime} at the latest.`,
    msgNoFasting: `\n\n✅ No fasting required for this test.`,
    msgFooter: `\n\n— Generated via LabPrep DZ`,
  }
};

function openReminderModal(testId) {
  const item = DB.find(d => d.id === testId);
  if (!item) return;
  const t = REMINDER_TEXT[currentLang];
  const body = document.getElementById('reminder-modal-body');

  // Default to tomorrow, 08:00 — a sensible default for most lab visits.
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  body.innerHTML = `
    <h2 class="modal-title" style="margin-bottom:6px"><i class="fa-solid fa-bell" style="color:var(--teal)"></i> ${t.title}</h2>
    <p class="modal-text" style="margin-bottom:16px;opacity:0.75">${t.intro}</p>

    <div class="reminder-form">
      <div class="reminder-field">
        <label class="timer-input-label">${t.dateLabel}</label>
        <input type="date" id="reminder-date" class="timer-time-input" value="${defaultDate}"/>
      </div>
      <div class="reminder-field">
        <label class="timer-input-label">${t.timeLabel}</label>
        <input type="time" id="reminder-time" class="timer-time-input" value="08:00"/>
      </div>
      <div class="reminder-field">
        <label class="timer-input-label">${t.nameLabel}</label>
        <input type="text" id="reminder-name" class="timer-time-input" placeholder="${t.namePlaceholder}"/>
      </div>
    </div>

    <div class="reminder-actions">
      <button class="timer-start-btn" id="reminder-send-btn" style="background:#25D366">
        <i class="fa-brands fa-whatsapp"></i> ${t.sendBtn}
      </button>
      <button class="print-btn" id="reminder-copy-btn" style="width:100%;justify-content:center;margin-top:8px">
        <i class="fa-solid fa-copy"></i> ${t.copyBtn}
      </button>
    </div>
  `;

  const buildMessage = () => {
    const dateVal = document.getElementById('reminder-date').value;
    const timeVal = document.getElementById('reminder-time').value;
    const nameVal = document.getElementById('reminder-name').value.trim();
    if (!dateVal || !timeVal) return null;

    const [y, m, d] = dateVal.split('-').map(Number);
    const [hh, mm] = timeVal.split(':').map(Number);
    const apptDate = new Date(y, m - 1, d, hh, mm);
    const dateLocale = currentLang === 'ar' ? 'ar-DZ' : (currentLang === 'en' ? 'en-US' : 'fr-FR');
    const dateStr = apptDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = apptDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

    let msg = t.msgReminder(nameVal, getName(item), dateStr, timeStr);

    if (item.fasting > 0) {
      const fastStart = new Date(apptDate.getTime() - item.fasting * 3600 * 1000);
      const fDateStr = fastStart.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' });
      const fTimeStr = fastStart.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
      msg += t.msgFasting(item.fasting, fDateStr, fTimeStr);
    } else {
      msg += t.msgNoFasting;
    }

    msg += t.msgFooter;
    return msg;
  };

  document.getElementById('reminder-send-btn').addEventListener('click', () => {
    const msg = buildMessage();
    if (!msg) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  });

  document.getElementById('reminder-copy-btn').addEventListener('click', (e) => {
    const msg = buildMessage();
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      const btn = e.currentTarget;
      const original = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t.copied}`;
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    }).catch(() => {});
  });

  document.getElementById('reminder-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeReminderModal() {
  document.getElementById('reminder-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function renderRecentStrip() {
  const strip = document.getElementById('recent-strip');
  if (!strip) return;
  if (recentlyViewed.length === 0) { strip.style.display = 'none'; return; }
  strip.style.display = 'flex';
  strip.innerHTML = recentlyViewed.map(id => {
    const item = DB.find(d => d.id === id);
    if (!item) return '';
    return `<button class="recent-chip" onclick="openModal(${id})">${getName(item)}</button>`;
  }).join('');
}
/* ═══════════════════════════════════════════════════════════════
   LANGUAGE TOGGLE
   ═══════════════════════════════════════════════════════════════ */

function cycleLang() {
  const idx = LANG_CYCLE.indexOf(currentLang);
  currentLang = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
  applyLang();
  renderRecentStrip();
  renderCards();
}

const CHARITY_BANNER_TEXT = {
  fr: "Ce projet est une œuvre caritative gratuite. Merci de prier pour la santé et la longévité de mes parents.",
  ar: "هذا المشروع عمل خيري مجاني. أتمنى منكم الدعاء لأمي و أبي بالصحة وطول العمر.",
  en: "This project is a free charitable work. Please pray for my parent's health and long life."
};
const TIMER_BTN_LABEL = {
  fr: "Démarrer un chronomètre de jeûne",
  ar: "ابدأ مؤقت الصيام",
  en: "Start a fasting timer"
};
// Language button always shows the NEXT language in the cycle
const NEXT_LANG_LABEL = { fr: 'AR', ar: 'EN', en: 'FR' };

function applyLang() {
  const ui = UI[currentLang];
  const body = document.body;

  // IMPORTANT: don't overwrite the whole className (that would wipe
  // dark-mode on every language switch) — toggle only the lang-* class.
  body.classList.remove('lang-fr', 'lang-ar', 'lang-en');
  body.classList.add('lang-' + currentLang);
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

  document.getElementById('brand-tagline').textContent = ui.tagline;
  document.getElementById('hero-title').innerHTML = ui.heroTitle;
  document.getElementById('hero-sub').textContent = ui.heroSub;
  document.getElementById('search-input').placeholder = ui.searchPlaceholder;
  document.getElementById('lang-btn-text').textContent = NEXT_LANG_LABEL[currentLang];
  document.getElementById('pill-all-lbl').textContent = ui.pillAll;
  document.getElementById('lbl-analyses').textContent = ui.unit;
  document.getElementById('footer-disclaimer').textContent = ui.footerDisclaimer;
  document.getElementById('charity-text').textContent = CHARITY_BANNER_TEXT[currentLang];
  document.getElementById('fasting-timer-btn-lbl').textContent = TIMER_BTN_LABEL[currentLang];
  document.getElementById('fav-modal-title').innerHTML = `<i class="fa-solid fa-star" style="color:#d97706"></i> ${ui.favTitle}`;
  const supportBtnText = document.getElementById('support-btn-text');
  if (supportBtnText) supportBtnText.textContent = SUPPORT_TEXT[currentLang].btn;

  updateChecklistBar();

  // Update pill labels
  document.querySelectorAll('.pill[data-cat]').forEach(pill => {
    const cat = pill.getAttribute('data-cat');
    if (cat !== 'all' && ui.pillLabels[cat]) {
      const span = pill.querySelector('span');
      if (span) span.textContent = ui.pillLabels[cat];
    }
  });

  updateFavCountBadge();
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH & FILTER HANDLERS
   ═══════════════════════════════════════════════════════════════ */

function initSearch() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const kbdHint = document.getElementById('search-kbd-hint');

  input.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    clearBtn.style.display = currentQuery ? 'block' : 'none';
    if (kbdHint) kbdHint.style.display = currentQuery ? 'none' : (kbdHint.dataset.wasVisible === '1' ? 'block' : 'none');
    renderCards();
  });

  if (kbdHint && kbdHint.style.display === 'block') kbdHint.dataset.wasVisible = '1';
}

function clearSearch() {
  const input = document.getElementById('search-input');
  input.value = '';
  currentQuery = '';
  document.getElementById('search-clear').style.display = 'none';
  renderCards();
  input.focus();
}

function initFilterPills() {
  const pills = document.querySelectorAll('.pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCat = pill.getAttribute('data-cat');
      renderCards();
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   MODAL EVENT LISTENERS (Escape key)
   ═══════════════════════════════════════════════════════════════ */

function initModalEvents() {
  const closers = {
    'modal-overlay': closeModal,
    'fav-overlay': closeFavorites,
    'timer-overlay': closeFastingTimer,
    'support-overlay': closeSupportModal,
    'checklist-overlay': closeChecklistModal,
    'reminder-overlay': closeReminderModal
  };
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const id in closers) {
      const overlay = document.getElementById(id);
      if (overlay && overlay.style.display === 'flex') { closers[id](); break; }
    }
  });
}

/* ── KEYBOARD SHORTCUTS ───────────────────────────────────────── */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K → focus search bar
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = document.getElementById('search-input');
      if (input) { input.focus(); input.select(); }
    }
    // "/" → focus search bar too (common convention), but not while typing elsewhere
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const input = document.getElementById('search-input');
      if (input) input.focus();
    }
  });

  // Only show the "Ctrl+K" hint badge on devices with a real keyboard (no coarse pointer)
  const hint = document.getElementById('search-kbd-hint');
  if (hint && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    hint.style.display = 'block';
  }
}

/* ═══════════════════════════════════════════════════════════════
   FAVORITES
   ═══════════════════════════════════════════════════════════════ */

function saveFavorites() {
  try { localStorage.setItem('labprepdz_favs', JSON.stringify(favorites)); } catch(e) {}
}

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx === -1) favorites.push(id); else favorites.splice(idx, 1);
  saveFavorites();
  updateFavCountBadge();
  renderCards(); // refresh star states on visible cards
}

function updateFavCountBadge() {
  const badge = document.getElementById('fav-count-badge');
  if (!badge) return;
  if (favorites.length > 0) {
    badge.textContent = favorites.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function openFavorites() {
  const ui = UI[currentLang];
  const container = document.getElementById('fav-list-container');
  const overlay = document.getElementById('fav-overlay');

  if (favorites.length === 0) {
    container.innerHTML = `
      <div class="fav-empty">
        <i class="fa-regular fa-star"></i>
        <p style="font-weight:600;color:var(--slate-600);margin-bottom:4px">${ui.favEmpty}</p>
        <p style="font-size:0.8rem">${ui.favEmptySub}</p>
      </div>
    `;
  } else {
    container.innerHTML = favorites.map(id => {
      const item = DB.find(d => d.id === id);
      if (!item) return '';
      return `
        <div class="fav-item-row" data-id="${id}">
          <span class="fav-item-name">${getName(item)}</span>
          <button class="fav-item-remove" data-remove-id="${id}" aria-label="remove"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
    }).join('') + `
      <div class="fav-export-row">
        <button class="print-btn" id="fav-export-btn" style="width:100%;justify-content:center">
          <i class="fa-solid fa-download"></i> ${EXPORT_TEXT[currentLang].exportBtn}
        </button>
      </div>
    `;

    container.querySelectorAll('.fav-item-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.fav-item-remove')) return;
        const id = parseInt(row.getAttribute('data-id'), 10);
        closeFavorites();
        setTimeout(() => openModal(id), 200);
      });
    });
    container.querySelectorAll('.fav-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-remove-id'), 10);
        toggleFavorite(id);
        openFavorites(); // refresh list
      });
    });
    const exportBtn = document.getElementById('fav-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportFavorites);
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeFavorites() {
  document.getElementById('fav-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

/* ── FAVORITES EXPORT ─────────────────────────────────────────── */
const EXPORT_TEXT = {
  fr: { exportBtn: 'Télécharger ma liste (.txt)', header: 'MES ANALYSES FAVORITES — LabPrep DZ', fasting: 'Jeûne', noFasting: 'Aucun jeûne requis' },
  ar: { exportBtn: 'تحميل قائمتي (.txt)', header: 'تحاليلي المفضلة — LabPrep DZ', fasting: 'الصيام', noFasting: 'لا يتطلب صيام' },
  en: { exportBtn: 'Download my list (.txt)', header: 'MY FAVORITE TESTS — LabPrep DZ', fasting: 'Fasting', noFasting: 'No fasting required' }
};

function exportFavorites() {
  const t = EXPORT_TEXT[currentLang];
  const items = favorites.map(id => DB.find(d => d.id === id)).filter(Boolean);
  if (items.length === 0) return;

  const contentLang = currentLang === 'en' ? 'fr' : currentLang;
  const divider = '='.repeat(50);
  const dateStr = new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-DZ' : (currentLang === 'en' ? 'en-US' : 'fr-FR'));

  let out = `${t.header}\n${dateStr}\n${divider}\n\n`;

  items.forEach((item, i) => {
    const name = getName(item);
    const fastLabel = item.fasting > 0 ? `${t.fasting}: ${item.fasting}h` : t.noFasting;
    const prep = contentLang === 'fr' ? item.prep_fr : item.prep_ar;

    out += `${i + 1}. ${name}\n`;
    out += `   ${fastLabel}\n`;
    prep.forEach((step, si) => { out += `   ${si + 1}) ${step}\n`; });
    out += `\n${divider}\n\n`;
  });

  out += `LabPrep DZ — All rights reserved to Zekraoui Rabah Allaa Eddine 🦑\n`;

  const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'labprepdz-favoris.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════
   CHECKLIST ("My Prescribed Tests") + FASTING RECONCILER
   Lets a patient tick off several tests from one prescription and
   get ONE combined view: the strictest fasting time that satisfies
   all of them, plus a warning for any test that would actually be
   HARMED by fasting too long (e.g. calcium/PTH-style edge cases).
   ═══════════════════════════════════════════════════════════════ */

const CHECKLIST_TEXT = {
  fr: {
    barLabel: (n) => n === 1 ? 'analyse sélectionnée' : 'analyses sélectionnées',
    title: 'Ma liste de prescription',
    intro: "Cochez toutes les analyses de votre ordonnance pour obtenir un plan de préparation unique et cohérent.",
    empty: "Aucune analyse sélectionnée. Appuyez sur le ✓ sur une carte pour l'ajouter ici.",
    fastingSummaryTitle: "TEMPS DE JEÛNE À RESPECTER",
    fastingSummaryText: (h) => `Jeûnez <strong>${h} heures</strong> avant votre prélèvement — cela couvre l'exigence la plus stricte parmi toutes les analyses sélectionnées.`,
    noFastingNeeded: "Aucune de vos analyses sélectionnées ne nécessite de jeûne.",
    conflictTitle: "⚠️ ATTENTION — CONFLIT DÉTECTÉ",
    conflictText: (names) => `Un jeûne prolongé peut altérer le résultat de : <strong>${names}</strong>. Parlez-en à votre médecin ou au laboratoire avant le prélèvement.`,
    listTitle: "ANALYSES DE CETTE LISTE",
    removeAll: "Tout effacer",
    printList: "Imprimer la liste",
    shareList: "Partager",
    addedToast: "Ajoutée à votre liste",
    removedToast: "Retirée de votre liste",
  },
  ar: {
    barLabel: (n) => 'تحليل محدد',
    title: 'قائمة وصفتي الطبية',
    intro: "حدد كل تحاليل وصفتك الطبية للحصول على خطة تحضير واحدة ومتناسقة.",
    empty: "لا توجد تحاليل محددة. اضغط على ✓ في أي بطاقة لإضافتها هنا.",
    fastingSummaryTitle: "مدة الصيام الواجب احترامها",
    fastingSummaryText: (h) => `صُم <strong>${h} ساعات</strong> قبل أخذ العينة — هذا يغطي أصرم شرط بين جميع التحاليل المحددة.`,
    noFastingNeeded: "لا يتطلب أي من التحاليل المحددة الصيام.",
    conflictTitle: "⚠️ تنبيه — تعارض مكتشف",
    conflictText: (names) => `الصيام لفترة طويلة قد يؤثر على نتيجة: <strong>${names}</strong>. تحدث مع طبيبك أو المخبر قبل أخذ العينة.`,
    listTitle: "تحاليل هذه القائمة",
    removeAll: "مسح الكل",
    printList: "طباعة القائمة",
    shareList: "مشاركة",
    addedToast: "أُضيف إلى قائمتك",
    removedToast: "أُزيل من قائمتك",
  },
  en: {
    barLabel: (n) => n === 1 ? 'test selected' : 'tests selected',
    title: 'My Prescription Checklist',
    intro: "Check off every test from your prescription to get one combined, consistent preparation plan.",
    empty: "No tests selected yet. Tap the ✓ on any card to add it here.",
    fastingSummaryTitle: "FASTING TIME TO FOLLOW",
    fastingSummaryText: (h) => `Fast for <strong>${h} hours</strong> before your sample collection — this covers the strictest requirement among all selected tests.`,
    noFastingNeeded: "None of your selected tests require fasting.",
    conflictTitle: "⚠️ WARNING — CONFLICT DETECTED",
    conflictText: (names) => `Prolonged fasting may alter the result of: <strong>${names}</strong>. Talk to your doctor or the lab before your sample is taken.`,
    listTitle: "TESTS IN THIS LIST",
    removeAll: "Clear all",
    printList: "Print list",
    shareList: "Share",
    addedToast: "Added to your list",
    removedToast: "Removed from your list",
  }
};

// Tests where over-fasting can actually distort the result (not just
// "not required" — genuinely counter-productive). Used to flag real
// conflicts in the reconciler, based on the "note" fields already
// written for these tests in the DB.
const OVER_FASTING_RISK_IDS = [11, 21, 58, 6]; // Calcémie, Fer sérique, Cortisol, Bilirubine

function saveChecklist() {
  try { localStorage.setItem('labprepdz_checklist', JSON.stringify(checklistItems)); } catch(e) {}
}

function toggleChecklistItem(id) {
  const idx = checklistItems.indexOf(id);
  if (idx === -1) checklistItems.push(id); else checklistItems.splice(idx, 1);
  saveChecklist();
  updateChecklistBar();
  renderCards(); // refresh checkbox states on visible cards
}

function updateChecklistBar() {
  const bar = document.getElementById('checklist-bar');
  const countEl = document.getElementById('checklist-bar-count');
  const labelEl = document.getElementById('checklist-bar-label');
  if (!bar) return;

  const t = CHECKLIST_TEXT[currentLang];
  if (checklistItems.length === 0) {
    bar.style.display = 'none';
  } else {
    bar.style.display = 'block';
    countEl.textContent = checklistItems.length;
    labelEl.textContent = t.barLabel(checklistItems.length);
  }
}

function openChecklistModal() {
  const t = CHECKLIST_TEXT[currentLang];
  const body = document.getElementById('checklist-modal-body');

  if (checklistItems.length === 0) {
    body.innerHTML = `
      <h2 class="modal-title" style="margin-bottom:16px"><i class="fa-solid fa-clipboard-check" style="color:var(--teal)"></i> ${t.title}</h2>
      <div class="fav-empty">
        <i class="fa-regular fa-square-check"></i>
        <p>${t.empty}</p>
      </div>
    `;
  } else {
    const items = checklistItems.map(id => DB.find(d => d.id === id)).filter(Boolean);

    // Reconciler: the strictest (max) fasting requirement among selected tests.
    const fastingItems = items.filter(i => i.fasting > 0);
    const maxFasting = fastingItems.length > 0 ? Math.max(...fastingItems.map(i => i.fasting)) : 0;

    // Conflict detection: tests known to be distorted by long fasting,
    // relevant only when the reconciled fast is meaningfully long (>=8h).
    const conflicts = items.filter(i => OVER_FASTING_RISK_IDS.includes(i.id) && maxFasting >= 8);
    const conflictNames = conflicts.map(i => getName(i)).join(currentLang === 'ar' ? '، ' : ', ');

    const fastingBlockHTML = maxFasting > 0 ? `
      <div class="modal-section warning">
        <div class="modal-section-title"><i class="fa-solid fa-clock"></i>${t.fastingSummaryTitle}</div>
        <p class="modal-text">${t.fastingSummaryText(maxFasting)}</p>
      </div>
    ` : `
      <div class="modal-section success">
        <div class="modal-section-title"><i class="fa-solid fa-circle-check"></i>${t.fastingSummaryTitle}</div>
        <p class="modal-text">${t.noFastingNeeded}</p>
      </div>
    `;

    const conflictBlockHTML = conflicts.length > 0 ? `
      <div class="modal-section danger">
        <div class="modal-section-title"><i class="fa-solid fa-triangle-exclamation"></i>${t.conflictTitle}</div>
        <p class="modal-text">${t.conflictText(conflictNames)}</p>
      </div>
    ` : '';

    const listHTML = items.map(item => `
      <div class="checklist-item-row">
        <div class="checklist-item-info">
          <span class="checklist-item-name">${getName(item)}</span>
          <span class="fasting-badge ${item.fasting === 0 ? 'no-fast' : ''}" style="margin-top:4px">
            <i class="fa-solid ${item.fasting === 0 ? 'fa-check' : 'fa-clock'}"></i>
            ${item.fasting === 0 ? UI[currentLang].noFasting : UI[currentLang].fastingReq(item.fasting)}
          </span>
        </div>
        <button class="checklist-item-remove" data-remove-id="${item.id}" aria-label="remove"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');

    body.innerHTML = `
      <h2 class="modal-title" style="margin-bottom:6px"><i class="fa-solid fa-clipboard-check" style="color:var(--teal)"></i> ${t.title}</h2>
      <p class="modal-text" style="margin-bottom:16px;opacity:0.75">${t.intro}</p>

      ${fastingBlockHTML}
      ${conflictBlockHTML}

      <div class="modal-section info">
        <div class="modal-section-title"><i class="fa-solid fa-list"></i>${t.listTitle}</div>
        <div class="checklist-item-list">${listHTML}</div>
      </div>

      <div class="checklist-actions">
        <button class="print-btn" onclick="window.print()"><i class="fa-solid fa-print"></i> ${t.printList}</button>
        <button class="print-btn" onclick="shareChecklist()"><i class="fa-brands fa-whatsapp"></i> ${t.shareList}</button>
        <button class="checklist-clear-btn" onclick="clearChecklist()"><i class="fa-solid fa-trash"></i> ${t.removeAll}</button>
      </div>
    `;

    body.querySelectorAll('.checklist-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-remove-id'), 10);
        toggleChecklistItem(id);
        openChecklistModal(); // refresh
      });
    });
  }

  document.getElementById('checklist-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeChecklistModal() {
  document.getElementById('checklist-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function clearChecklist() {
  checklistItems = [];
  saveChecklist();
  updateChecklistBar();
  renderCards();
  closeChecklistModal();
}

function shareChecklist() {
  const items = checklistItems.map(id => DB.find(d => d.id === id)).filter(Boolean);
  if (items.length === 0) return;

  const fastingItems = items.filter(i => i.fasting > 0);
  const maxFasting = fastingItems.length > 0 ? Math.max(...fastingItems.map(i => i.fasting)) : 0;

  const lines = items.map((item, i) => `${i + 1}. ${getName(item)}`);
  const fastingLine = maxFasting > 0
    ? `\n⏱ ${CHECKLIST_TEXT[currentLang].fastingSummaryText(maxFasting).replace(/<\/?strong>/g, '')}`
    : '';
  const text = `${CHECKLIST_TEXT[currentLang].title}\n\n${lines.join('\n')}${fastingLine}\n\n— LabPrep DZ`;

  if (navigator.share) {
    navigator.share({ title: CHECKLIST_TEXT[currentLang].title, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert(currentLang === 'ar' ? 'تم النسخ!' : (currentLang === 'en' ? 'Copied!' : 'Copié !'));
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   FASTING TIMER
   ═══════════════════════════════════════════════════════════════ */

function saveFastingTimer() {
  try {
    if (fastingTimer.active) {
      localStorage.setItem('labprepdz_timer', JSON.stringify({ hours: fastingTimer.hours, endTime: fastingTimer.endTime }));
    } else {
      localStorage.removeItem('labprepdz_timer');
    }
  } catch(e) {}
}

function openFastingTimer() {
  renderTimerModal();
  document.getElementById('timer-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  if (fastingTimer.active) startTimerInterval();
}

function closeFastingTimer() {
  document.getElementById('timer-overlay').style.display = 'none';
  document.body.style.overflow = '';
  if (fastingTimer.intervalId) { clearInterval(fastingTimer.intervalId); fastingTimer.intervalId = null; }
}

function renderTimerModal() {
  const ui = UI[currentLang];
  const body = document.getElementById('timer-modal-body');

  if (!fastingTimer.active) {
    body.innerHTML = `
      <div class="timer-setup">
        <h2 class="timer-setup-title"><i class="fa-solid fa-hourglass-half" style="color:var(--teal);margin-inline-end:8px"></i>${ui.timerTitle}</h2>
        <p style="font-size:0.85rem;color:var(--slate-600)">${ui.timerPick}</p>
        <div class="timer-hour-options">
          ${[4,8,10,12].map(h => `<button class="timer-hour-btn" data-hours="${h}">${h}h</button>`).join('')}
        </div>
        <button class="timer-start-btn" id="timer-start-confirm" disabled>${ui.timerStart}</button>
      </div>
    `;

    let selectedHours = null;
    body.querySelectorAll('.timer-hour-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.timer-hour-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedHours = parseInt(btn.getAttribute('data-hours'), 10);
        document.getElementById('timer-start-confirm').disabled = false;
      });
    });
    document.getElementById('timer-start-confirm').addEventListener('click', () => {
      if (!selectedHours) return;
      const endTime = new Date(Date.now() + selectedHours * 3600 * 1000).toISOString();
      fastingTimer = { active: true, hours: selectedHours, endTime, intervalId: null };
      saveFastingTimer();
      renderTimerModal();
      startTimerInterval();
    });
  } else {
    renderTimerActive();
    startTimerInterval();
  }
}

function renderTimerActive() {
  const ui = UI[currentLang];
  const body = document.getElementById('timer-modal-body');
  const end = new Date(fastingTimer.endTime).getTime();
  const now = Date.now();
  const remainingMs = Math.max(0, end - now);
  const totalMs = fastingTimer.hours * 3600 * 1000;
  const pct = Math.min(100, ((totalMs - remainingMs) / totalMs) * 100);

  const h = Math.floor(remainingMs / 3600000);
  const m = Math.floor((remainingMs % 3600000) / 60000);
  const s = Math.floor((remainingMs % 60000) / 1000);
  const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  const endDate = new Date(fastingTimer.endTime);
  const endTimeStr = endDate.toLocaleTimeString(currentLang === 'ar' ? 'ar-DZ' : (currentLang === 'en' ? 'en-US' : 'fr-FR'), {hour:'2-digit',minute:'2-digit'});

  if (remainingMs <= 0) {
    body.innerHTML = `
      <div class="timer-active">
        <div class="timer-finished-badge"><i class="fa-solid fa-circle-check"></i>${ui.timerDone}</div>
        <button class="timer-cancel-btn" id="timer-reset-btn">${ui.timerCancel}</button>
      </div>
    `;
    document.getElementById('timer-reset-btn').addEventListener('click', resetFastingTimer);
    if (fastingTimer.intervalId) { clearInterval(fastingTimer.intervalId); fastingTimer.intervalId = null; }
    return;
  }

  body.innerHTML = `
    <div class="timer-active">
      <div class="timer-circle" style="--pct:${pct}">
        <div class="timer-circle-text">
          <span class="timer-time-left">${timeStr}</span>
          <span class="timer-time-label">${ui.timerRemaining}</span>
        </div>
      </div>
      <p class="timer-done-at">${ui.timerDoneAt} <strong>${endTimeStr}</strong></p>
      <button class="timer-cancel-btn" id="timer-cancel-btn">${ui.timerCancel}</button>
    </div>
  `;
  const cancelBtn = document.getElementById('timer-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', resetFastingTimer);
}

function startTimerInterval() {
  if (fastingTimer.intervalId) clearInterval(fastingTimer.intervalId);
  fastingTimer.intervalId = setInterval(() => {
    if (document.getElementById('timer-overlay').style.display === 'flex') {
      renderTimerActive();
    }
  }, 1000);
}

function resetFastingTimer() {
  if (fastingTimer.intervalId) clearInterval(fastingTimer.intervalId);
  fastingTimer = { active: false, hours: 0, endTime: null, intervalId: null };
  saveFastingTimer();
  renderTimerModal();
}

/* ═══════════════════════════════════════════════════════════════
   SOCIAL LINKS
   Fill in your links below — leave as '#' to hide that icon.
   ═══════════════════════════════════════════════════════════════ */

const SOCIAL_LINKS = {
  linkedin:  'www.linkedin.com/in/zekraouirabahallaaeddine',   // e.g. 'https://www.linkedin.com/in/your-profile'
  instagram: 'https://www.instagram.com/thismf3ya?igsh=OG1vYTNzOXNwanBq',   // e.g. 'https://www.instagram.com/your-handle'
  telegram:  'https://t.me/Itzjust_me'    // e.g. 'https://t.me/your-channel'
};

function initSocialLinks() {
  Object.keys(SOCIAL_LINKS).forEach(platform => {
    const el = document.getElementById('social-' + platform);
    if (!el) return;
    const url = SOCIAL_LINKS[platform];
    if (url && url !== '#') {
      el.href = url;
    } else {
      el.style.display = 'none'; // hide until a real link is added
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   SUPPORT / DONATION
   Fill in your real CCP/BaridiMob details below. Leave a value as
   '#' to hide that specific option until you add it.
   ═══════════════════════════════════════════════════════════════ */

const SUPPORT_INFO = {
  ccp: '0040145075 Clé: 84 Nom:Zekraoui  Prénom: Rabah Allaa Eddine',         // e.g. 'CCP: 0012345678 Clé 45'
  baridimob: '00799999004014507584',   // e.g. 'RIP: 007 999 0012345678 90'
  note: '#'         // optional extra note, e.g. a name to search on BaridiMob app
};

const SUPPORT_TEXT = {
  fr: { title: 'Soutenir ce projet', btn: 'Soutenir ce projet',
        intro: "Ce site restera toujours gratuit. Si vous souhaitez soutenir son développement, voici mes coordonnées CCP / BaridiMob.",
        copy: 'Copier', copied: 'Copié !', empty: "Aucune information de soutien n'est encore disponible. Revenez bientôt !" },
  ar: { title: 'دعم هذا المشروع', btn: 'دعم هذا المشروع',
        intro: "سيبقى هذا الموقع مجانياً دائماً. إذا رغبت في دعم تطويره، إليك معلومات CCP / بريدي موب الخاصة بي.",
        copy: 'نسخ', copied: 'تم النسخ!', empty: 'لا توجد معلومات دعم متاحة بعد. عودوا قريباً!' },
  en: { title: 'Support this project', btn: 'Support this project',
        intro: "This site will always stay free. If you'd like to support its development, here are my CCP / BaridiMob details.",
        copy: 'Copy', copied: 'Copied!', empty: 'No support info available yet. Check back soon!' }
};

function openSupportModal() {
  const t = SUPPORT_TEXT[currentLang];
  const body = document.getElementById('support-modal-body');
  const hasAny = (SUPPORT_INFO.ccp && SUPPORT_INFO.ccp !== '#') || (SUPPORT_INFO.baridimob && SUPPORT_INFO.baridimob !== '#');

  let optionsHTML = '';
  if (SUPPORT_INFO.ccp && SUPPORT_INFO.ccp !== '#') {
    optionsHTML += `
      <div class="support-option">
        <i class="fa-solid fa-building-columns"></i>
        <div class="support-option-text">
          <div class="support-option-label">CCP</div>
          <div class="support-option-value">${SUPPORT_INFO.ccp}</div>
        </div>
        <button class="support-copy-btn" onclick="copySupportValue(this, '${SUPPORT_INFO.ccp.replace(/'/g,"\\'")}')">${t.copy}</button>
      </div>`;
  }
  if (SUPPORT_INFO.baridimob && SUPPORT_INFO.baridimob !== '#') {
    optionsHTML += `
      <div class="support-option">
        <i class="fa-solid fa-mobile-screen"></i>
        <div class="support-option-text">
          <div class="support-option-label">BaridiMob</div>
          <div class="support-option-value">${SUPPORT_INFO.baridimob}</div>
        </div>
        <button class="support-copy-btn" onclick="copySupportValue(this, '${SUPPORT_INFO.baridimob.replace(/'/g,"\\'")}')">${t.copy}</button>
      </div>`;
  }

  body.innerHTML = `
    <h2 class="modal-title" style="margin-bottom:10px"><i class="fa-solid fa-heart" style="color:#f87171"></i> ${t.title}</h2>
    <p class="modal-text" style="margin-bottom:16px">${t.intro}</p>
    ${hasAny ? optionsHTML : `<p class="modal-text" style="opacity:0.7;font-style:italic">${t.empty}</p>`}
  `;

  document.getElementById('support-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSupportModal() {
  document.getElementById('support-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function copySupportValue(btn, value) {
  const t = SUPPORT_TEXT[currentLang];
  navigator.clipboard.writeText(value).then(() => {
    const original = btn.textContent;
    btn.textContent = t.copied;
    setTimeout(() => { btn.textContent = original; }, 1500);
  }).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
function toggleDarkMode() {
  darkMode = !darkMode;
  applyDarkMode();
  localStorage.setItem('labprepdz_dark', darkMode ? '1' : '0');
}
function applyDarkMode() {
  document.body.classList.toggle('dark-mode', darkMode);
  document.documentElement.classList.toggle('dark-mode', darkMode);
  document.getElementById('dark-icon').className = darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

/* ── TEXT SIZE CONTROL ────────────────────────────────────────── */
function changeTextSize(delta) {
  textSizeStep = Math.max(0, Math.min(4, textSizeStep + delta));
  applyTextSize();
  localStorage.setItem('labprepdz_textsize', String(textSizeStep));
}
function applyTextSize() {
  const html = document.documentElement;
  for (let i = 1; i <= 4; i++) html.classList.remove('text-size-' + i);
  if (textSizeStep > 0) html.classList.add('text-size-' + textSizeStep);

  const minusBtn = document.getElementById('text-size-minus');
  const plusBtn = document.getElementById('text-size-plus');
  if (minusBtn) minusBtn.classList.toggle('at-limit', textSizeStep === 0);
  if (plusBtn) plusBtn.classList.toggle('at-limit', textSizeStep === 4);
}
function boot() {
  applyDarkMode();
  applyTextSize();
  applyLang();
  initKeyboardShortcuts();
  initSearch();
  initFilterPills();
  initModalEvents();
  initSocialLinks();
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  renderCards();
  updateChecklistBar();
  registerServiceWorker();
  console.log(
    '%c[LabPrep DZ] ' + DB.length + ' analyses loaded. All rights reserved to Zekraoui Rabah Allaa Eddine 🦑',
    'color:#0d9488; font-family:monospace; font-size:12px;'
  );
}

/* ── PWA SERVICE WORKER ───────────────────────────────────────── */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('sw.js').then((reg) => {
    // Detect when a new version has been installed in the background
    // and is waiting to take over — show a small "update available" toast.
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });
    });
  }).catch(() => {});
}

function showUpdateToast() {
  if (document.getElementById('update-toast')) return; // already showing
  const toast = document.createElement('div');
  toast.id = 'update-toast';
  toast.className = 'update-toast';
  const label = currentLang === 'ar' ? 'تتوفر نسخة جديدة — اضغط للتحديث'
              : currentLang === 'en' ? 'New version available — tap to update'
              : 'Nouvelle version disponible — appuyez pour mettre à jour';
  toast.innerHTML = `<i class="fa-solid fa-rotate"></i> <span>${label}</span>`;
  toast.addEventListener('click', () => window.location.reload());
  document.body.appendChild(toast);
}

document.addEventListener('DOMContentLoaded', boot);
