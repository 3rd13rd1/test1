var instruments=[];

var all_instruments =  pol = count =  min_price_change = min_coin_vol = min_vol_change = min_vol_change_to_highlight =  min_price_change_to_highlight =  price_change_be =  market =  null

var timer = clock = sto= 0;

var aud = document.createElement('audio');
    aud.setAttribute('src', 'alert.mp3');
    
var blacklist = window.localStorage.blacklist || "[]";
$("#blacklist").val(blacklist.split(/"|\[|\]/).join(""));
blacklist = JSON.parse(blacklist);


function play_sound(){
	aud.play();
} 

function load_instruments(dat){

				instruments=[];
				if(dat)
				all_instruments = dat;
				else
				dat = all_instruments;

				dat.forEach(function(item){
						if(item.symbol.indexOf(market)>0){
							item.quoteVolume = Number(item.quoteVolume);
							item.prev_price_change=0;
							item.prev_vol_change=0;
							item.appearances=0;
							item.price_change = 0;
							item.vol_change = 0;
							item.recent_appeared=false;
							item.price_history=[0,0,0,0,0,0,0];
							instruments.push(item);
						}
					});
}

function tick(){

	$("#countdown-1").html(count);
	if(count==0){
		count=pol;
		updater(); // async function
	}
	$("#clock").html((Math.floor((clock/60)/60))+" : "+Math.floor(clock/60)+" : "+clock%60);
	clock++;
	count--;
}

function updater(){ 

	$.getJSON({
			url:"https://api.binance.com/api/v1/ticker/24hr",
			success:function(dt){
				dt.forEach(function(dt){

					sym = dt.symbol;

					id = instruments.findIndex(function(e){// find index in saved instruments
						if(e.symbol==sym)
							return true;
						else 
							return false;
					});

					if(id>-1  && !blacklist.includes(sym) && dt.lastPrice*1 >0 ){

						ins = instruments[id];
						dt.quoteVolume = Number(dt.quoteVolume);
						dt.lastPrice = Number(dt.lastPrice);

						ins.price_history.shift();
						ins.price_history.push(Number(dt.lastPrice));

						dt.price_change = Number.parseFloat(100*((dt.lastPrice-ins.lastPrice)/ins.lastPrice)).toFixed(2);
						dt.prev_price_change = ins.prev_price_change; 

						dt.vol_change   = Number.parseFloat(100*((dt.quoteVolume-ins.quoteVolume)/ins.quoteVolume)).toFixed(1);
						dt.vol_change_net = Number.parseFloat(dt.quoteVolume-ins.quoteVolume).toFixed(1);
						dt.prev_vol_change = ins.prev_vol_change;

						dt.recent_appeared = ins.recent_appeared;
						dt.appearances = ins.appearances;
						dt.price_history = ins.price_history;

						instruments[id]=dt; // to update all default fields

					}

				});

				update_view();

				instruments.forEach(function(t){

					t.prev_vol_change = t.vol_change;
					t.prev_price_change=t.price_change; 
					
				});
			}
		});
}

function update_view(){
 

	let show=[];

	instruments.forEach(function(t){

	
	let show_and_hightlight = false
	
	let coin_has_enough_24h_vol = t.quoteVolume >= min_coin_vol

	if( (t.price_history[4]>t.price_history[3] && 
		t.price_history[6]>t.price_history[5] && 
		t.price_history[5]>t.price_history[4] && 
		t.price_history[3]>t.price_history[2] && 
		t.price_history[2]>t.price_history[1]&& 
		t.price_history[1]>t.price_history[0])){

		show_and_hightlight = true;
	} 

	let o=0;
	switch(price_change_be){
		case 'p':
		o= t.price_change > min_price_change
		break;
		case 'n':
		o= (-1*t.price_change) > min_price_change
		break;
		default:
		o = Math.abs(t.price_change) > min_price_change
	}
	let coin_has_enough_price_change = o
 
	fc1 = coin_has_enough_price_change && 
		  t.vol_change > min_vol_change && 
		  coin_has_enough_24h_vol  // universal conditions


		if(fc1){


			sc1 = t.vol_change > t.prev_vol_change && t.recent_appeared

			sc2 = t.vol_change >= min_vol_change_to_highlight

			sc3 = t.price_change >= min_price_change_to_highlight 

			if( sc1 || sc2 || sc3 || show_and_hightlight) {

				play_sound();
				t.highlight = true; // show and highlight]

				t.highlight_reason = sc1 ? "Vol increased & also listed in previous interval" 
									: sc2 ? "Volume change > min vol change to hightlight" 
									: "Price change > min price change to hightlight";
				if(show_and_hightlight)
					t.highlight_reason = "Coin is pumping";
			}
			else{
				t.highlight = false; // show but don't highlight
				t.highlight_reason = "Matched list conditions."
			}

			t.appearances++;
			t.recent_appeared = true;
			show.push(t); 
		} 
		else
			t.recent_appeared = false;
	});

	show.sort(function(a,b){
			if(a.price_change<b.price_change)	
				return -1;
			else if(a.price_change>b.price_change)
				return 1;
			else
				return 0;
		});

	$("#table-1").prepend("<hr>");

	show.forEach(function(t){

		row="<div class='irow' data-highlight='"+t.highlight+"' title='"+t.highlight_reason+"' target='_blank'>\
				<div>"+t.appearances+"</div>\
				<div class='tlinks'><a target='_blank' href='https://www.binance.com/en/trade/"+t.symbol+"'>"+t.symbol+"</a>\
				<a target='_blank' href='https://www.binance.com/en/futures/"+t.symbol+"'>[Futures]</a></div>\
				<div>"+t.lastPrice+"</div>\
				<div><span class='price_change' data-change='"+t.priceChangePercent+"'>"+Number.parseFloat(t.priceChangePercent).toFixed(1)+"%</span></div>\
				<div>"+t.quoteVolume.toFixed(0)+"</div>\
				<div>"+t.vol_change+"%<span class='prev'>"+t.vol_change_net+"</span></div>\
				<div><span  class='price_change' data-change='"+t.price_change+"'>"+t.price_change+"%</span>\
					 <span title='Change during previous appearance' class='price_change prev' data-change='"+t.prev_price_change+"'>"+t.prev_price_change+"%</span>\
				</div>\
			</div>";

		$("#table-1").prepend(row);
	});
	
}

function update_tracker(load_i=true){

	pol = count = Number($("#pol").val());
	market = $("#market").val();

	min_price_change = Number($("#min_price_change").val());
	min_vol_change = Number($("#min_vol_change").val());
    min_vol_change_to_highlight =  Number($("#min_vol_change_to_highlight").val());
    min_price_change_to_highlight =  Number($("#min_price_change_to_highlight").val());
	price_change_be = $("#price_change_be").val();

	min_coin_vol   = Number($("#min_coin_vol").val());

	black = $("#blacklist").val();
	blacklist = black.split(" ").join("").split(",");
	window.localStorage.blacklist = JSON.stringify(blacklist);

	if(load_i)
		load_instruments(); // reload instruments with new market
	 
	clearInterval(timer);
	clearTimeout(sto);

	let strt = 59-new Date().getSeconds();
	clock = 0;
//strt=0;
	sto = setTimeout(()=>{

		timer = setInterval(tick,1000); 

	},strt*1000);

	$("#countdown-1").html("Starting in 1 minute, don't refresh")

	return false;
}

function init(){

	
	update_tracker(false);

	$.getJSON({url:"https://api.binance.com/api/v1/ticker/24hr",
			success:load_instruments
			});

} 

$('form').submit(update_tracker);

init();