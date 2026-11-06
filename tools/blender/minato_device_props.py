"""Period appliances and ceramic mascots, replacing the old block placeholders."""
import math


def upgrade_device_props(api):
    old, remove, snapshot = (api[k] for k in ('old','remove','snapshot'))
    cube,cyl,cone,ball,ring,tube,text=(api[k] for k in ('cube','cyl','cone','ball','ring','tube','text'))
    M,mat=api['M'],api['mat'];inventory={}
    key=mat('Register key ivory','d0c5aa',.67)
    display=mat('Appliance dark glass','293e3b',.24)
    digit=mat('Display green lettering','a7b386',.55)
    cat_ink=mat('Lucky mascot ink','413229',.65)
    pink=mat('Lucky cat inner ear','c78370',.67)
    screen=mat('Old television screen','687d79',.3)

    def shifted(p,x=0,y=0,z=0):return p[0]+x,p[1]+y,p[2]+z
    def find(name):
        found=[snapshot(o) for o in old(name)];inventory[name]=len(found);return found

    tills=find('Till');remove(['Till','Till keys','Till display'])
    for item in tills:
        p=item['at'];bottom=p[1]-.08
        cube('Real register base',(.32,.06,.28),shifted(p,0,-.05),M['cream'],bevel=.018)
        cube('Register cash drawer',(.276,.041,.006),shifted(p,0,-.06,.143),M['steel'],bevel=.005)
        cyl('Register drawer keyhole',.005,.003,shifted(p,.085,-.06,.148),M['darksteel'],12,axis='z')
        cube('Register upper case',(.30,.10,.18),shifted(p,0,.026,-.028),M['cream'],bevel=.024)
        for row in range(4):
            for col in range(6):cube('Register individual key',(.026,.008,.018),shifted(p,-.104+col*.039,.083,-.045+row*.027),M['red'] if col==5 else key,bevel=.004)
        cube('Register display hood',(.16,.074,.043),shifted(p,.05,.104,-.104),M['cream'],bevel=.008)
        cube('Register customer display',(.132,.045,.003),shifted(p,.05,.106,-.127),display,bevel=.004)
        text('Register total','0 0 0 0',shifted(p,.0,.10,-.13),.014,digit,yaw=math.pi)
        cube('Register paper slot',(.043,.005,.08),shifted(p,-.097,.089,-.05),M['darksteel'])
        cube('Register receipt',(.033,.002,.058),shifted(p,-.097,.094,-.05),M['porcelain'])
        for j in range(4):cube('Receipt printed line',(.023,.0005,.001),shifted(p,-.097,.095,-.067+j*.012),M['darksteel'])

    cats=find('Maneki-neko body');remove(['Maneki-neko base','Maneki-neko body','Maneki-neko head','Maneki-neko ear','Maneki-neko paw','Maneki-neko collar'])
    for item in cats:
        p=item['at'];cyl('Lucky cat cushion',.068,.018,shifted(p,0,-.079),M['red'],20)
        ball('Lucky cat ceramic body',(.059,.071,.052),p,M['porcelain'],18,12)
        ball('Lucky cat face',(.052,.047,.043),shifted(p,0,.108),M['porcelain'],18,12)
        for dx in (-.033,.033):
            cone('Lucky cat pointed ear',.019,0,.037,shifted(p,dx,.154),M['porcelain'],3)
            cone('Lucky cat pink ear',.012,0,.024,shifted(p,dx,.155,-.008),pink,3)
            ball('Lucky cat muzzle',(.018,.011,.008),shifted(p,dx*.35,.095,.043),M['porcelain'],10,6)
            tube('Lucky cat closed eye',[shifted(p,dx-.008,.113,.04),shifted(p,dx,.119,.044),shifted(p,dx+.008,.113,.04)],.0014,cat_ink)
            for j in range(2):tube('Lucky cat whisker',[shifted(p,dx,.089+j*.01,.045),shifted(p,dx*1.45,.087+j*.013,.043)],.0007,cat_ink)
            ball('Lucky cat foot',(.021,.012,.03),shifted(p,dx,-.055,.033),M['porcelain'],12,8)
        ball('Lucky cat nose',(.004,.003,.003),shifted(p,0,.104,.048),pink,10,6)
        ball('Lucky cat raised arm',(.019,.045,.019),shifted(p,.061,.056,.017),M['porcelain'],12,8)
        ball('Lucky cat beckoning paw',(.022,.024,.016),shifted(p,.061,.124,.033),M['porcelain'],12,8)
        for j in range(3):tube('Lucky cat paw crease',[shifted(p,.05+j*.008,.13,.048),shifted(p,.05+j*.008,.118,.049)],.00065,cat_ink)
        cube('Lucky cat collar',(.071,.011,.055),shifted(p,0,.064),M['red'],bevel=.005)
        ball('Lucky cat brass bell',(.008,.008,.006),shifted(p,0,.057,.041),M['brass'],12,8)
        ball('Lucky cat gold coin',(.026,.036,.005),shifted(p,-.01,-.001,.054),M['brass'],16,10)
        text('Lucky cat coin mark','福',shifted(p,-.022,-.014,.06),.023,cat_ink)

    radios=find('Radio cabinet');remove(['Radio cabinet','Radio cloth','Radio dial'])
    for item in radios:
        p=item['at'];cube('Real valve radio cabinet',(1,.56,.38),p,M['honey'],bevel=.045)
        cube('Radio face trim',(.918,.475,.012),shifted(p,0,0,.196),M['smoke'],bevel=.028)
        cube('Radio woven cloth',(.52,.348,.006),shifted(p,-.17,0,.204),M['straw'],bevel=.016)
        for row in range(16):cube('Radio cloth weave',(.50,.001,.001),shifted(p,-.17,-.158+row*.021,.208),M['rope'])
        for col in range(24):cube('Radio cloth warp',(.001,.34,.001),shifted(p,-.408+col*.021,0,.208),M['honey'])
        cube('Radio tuning glass',(.276,.125,.008),shifted(p,.28,.08,.207),display,bevel=.01)
        for j in range(11):cube('Radio tuning tick',(.002,.01+(j%2)*.005,.001),shifted(p,.168+j*.023,.06,.213),key)
        cube('Radio tuning needle',(.002,.09,.001),shifted(p,.29,.08,.214),M['red'])
        text('Radio waveband','AM · FM',shifted(p,.18,.09,.215),.022,key)
        for dx in (.18,.38):
            cyl('Radio knob',.039,.027,shifted(p,dx,-.118,.22),M['cream'],20,axis='z')
            cube('Radio knob marker',(.002,.015,.001),shifted(p,dx,-.108,.235),M['smoke'])
        for dx in (-.37,.37):cube('Radio foot',(.12,.022,.18),shifted(p,dx,-.289,0),M['darksteel'],bevel=.007)

    speakers=find('Speaker cabinet');remove(['Speaker cabinet','Speaker grille','Speaker woofer','Speaker tweeter'])
    for item in speakers:
        p=item['at'];cube('Real speaker cabinet',(.3,.46,.3),p,M['lacquer'],bevel=.025)
        cube('Speaker recessed baffle',(.009,.416,.26),shifted(p,.153),M['speaker'],bevel=.012)
        for dy,r in ((-.07,.093),(.13,.032)):
            cyl('Speaker cone',r,.011,shifted(p,.16,dy),M['darksteel'],24,axis='x')
            # Separate surround and dome make it read as a driver, not a circle sticker.
            o=ring('Speaker rubber surround',r,.006,shifted(p,.171,dy),M['lacquer']);o.rotation_euler.y=math.pi/2
            ball('Speaker dust cap',(.012,r*.34,r*.34),shifted(p,.178,dy),M['smoke'],12,8)
        for dy in (-.196,.196):
            for dz in (-.116,.116):cyl('Speaker baffle screw',.003,.003,shifted(p,.163,dy,dz),M['steel'],8,axis='x')

    machines=find('Ticket machine');remove(['Ticket machine','Ticket machine panel','Ticket button','Coin slot','Ticket tray'])
    for item in machines:
        p=item['at'];front=p[2]-.255
        cube('Real meal ticket machine',(.72,1.6,.5),p,M['ticket'],bevel=.045)
        cube('Ticket selection face',(.61,.71,.01),(p[0],1.17,front-.005),M['cream'],bevel=.016)
        for row in range(4):
            for col in range(3):
                at=(p[0]-.18+col*.18,.98+row*.14,front-.018)
                cube('Ticket selection bevel',(.15,.11,.013),at,M['darksteel'],bevel=.009)
                cube('Ticket illuminated choice',(.132,.089,.004),shifted(at,0,0,-.009),M['red'] if (row+col)%4==0 else M['porcelain'],bevel=.008)
                text('Meal choice',('RAMEN','SHIO','MISO')[col],shifted(at,-.054,.006,-.012),.011,M['smoke'],yaw=math.pi)
                text('Meal price',str(550+row*100),shifted(at,-.024,-.025,-.012),.012,M['smoke'],yaw=math.pi)
        cube('Ticket payment steel',(.19,.14,.007),(p[0]+.205,1.54,front-.01),M['steel'],bevel=.008)
        cube('Ticket coin slit',(.056,.006,.002),(p[0]+.205,1.575,front-.016),M['darksteel'])
        cyl('Ticket refund button',.014,.003,(p[0]+.25,1.51,front-.017),M['red'],16,axis='z')
        cube('Ticket dispensing mouth',(.30,.052,.009),(p[0],.7,front-.009),M['darksteel'],bevel=.005)
        cube('Ticket tray base',(.32,.012,.078),(p[0],.671,front-.038),M['steel'])
        for dx in (-.155,.155):cube('Ticket tray cheek',(.012,.031,.078),(p[0]+dx,.688,front-.038),M['steel'])
        text('Ticket instruction','MEAL TICKETS',(p[0]-.24,1.68,front-.018),.032,M['cream'],yaw=math.pi)
        for dx in (-.23,.23):cube('Ticket machine foot',(.12,.024,.28),shifted(p,dx,-.812),M['darksteel'],bevel=.008)

    tvs=find('Old television');duplicates=find('Ramen television')
    remove(['Old television','Television glass','TV dial','Ramen television','TV bracket'])
    for item in tvs:
        p=item['at'];cube('Real corner CRT cabinet',(.66,.48,.42),p,M['smoke'],bevel=.035)
        cube('CRT raised bezel',(.584,.42,.015),shifted(p,0,.008,-.218),M['darksteel'],bevel=.028)
        cube('CRT curved screen',(.46,.33,.012),shifted(p,-.038,.018,-.229),screen,bevel=.025)
        for j in range(12):cube('CRT scanline',(.434,.0007,.001),shifted(p,-.038,-.12+j*.024,-.236),display)
        for y in (-.065,.065):
            cyl('CRT channel dial',.032,.019,shifted(p,.246,y,-.235),M['honey'],20,axis='z')
            cube('CRT knob pointer',(.003,.018,.001),shifted(p,.246,y+.008,-.246),M['cream'])
        for j in range(8):cube('CRT speaker grille',(.06,.003,.001),shifted(p,.245,-.189+j*.009,-.231),M['smoke'])
        for x in (-.245,.245):cube('CRT rubber foot',(.065,.024,.24),shifted(p,x,-.248),M['lacquer'],bevel=.007)
        tube('CRT antenna left',[shifted(p,-.05,.242,.02),shifted(p,-.20,.37,.09)],.002,M['steel'])
        tube('CRT antenna right',[shifted(p,.05,.242,.02),shifted(p,.20,.37,.09)],.002,M['steel'])

    dolls=find('Daruma');remove(['Daruma'])
    for item in dolls:
        p=item['at'];ball('Real ceramic daruma',(.10,.12,.09),p,M['red'],20,12)
        ball('Daruma cream face',(.067,.059,.006),shifted(p,0,.024,.084),M['cream'],16,10)
        for dx in (-.028,.028):
            ball('Daruma white eye',(.016,.014,.003),shifted(p,dx,.031,.091),M['porcelain'],12,8)
            ball('Daruma pupil',(.007,.007,.001),shifted(p,dx,.031,.095),cat_ink,10,6)
            tube('Daruma heavy eyebrow',[shifted(p,dx-.017,.052,.088),shifted(p,dx,.058,.091),shifted(p,dx+.017,.052,.088)],.003,cat_ink)
            for j in range(3):tube('Daruma beard',[shifted(p,dx*.6,-.01,.089),shifted(p,dx*1.5,-.026-j*.009,.086)],.0018,cat_ink)
        text('Daruma luck','福',shifted(p,-.025,-.069,.077),.04,M['cream'])
    inventory['duplicate-television-removed']=len(duplicates)
    return inventory
