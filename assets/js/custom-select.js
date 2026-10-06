/* Progressive custom selects: the native control still owns values, validation and form submission. */
(function () {
 'use strict';
 var active = null, count = 0;
 function closeCustomSelects() {
  if (active) { active.close(); }
 }
 window.closeCustomSelects = closeCustomSelects;
 function enhance(select) {
  if (select.dataset.customSelect || select.multiple || select.size > 1) { return; }
  select.dataset.customSelect = 'true';
  var uid = 'custom-select-' + (++count), wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  select.parentNode.insertBefore(wrapper, select); wrapper.appendChild(select);
  var trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'custom-select__trigger';
  trigger.setAttribute('role', 'combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',uid);
  if (select.required) { trigger.setAttribute('aria-required','true'); }
  var label = select.getAttribute('aria-label') || (select.hasAttribute('data-sort') ? 'ترتيب السيارات' : '');
  if (!label) { var lab = select.closest('label'); var span = lab && lab.querySelector('.field__label'); label = span ? span.textContent.trim() : select.name || 'اختر'; }
  trigger.setAttribute('aria-label',label);
  var value = document.createElement('span'), chevron = document.createElement('span');chevron.className='custom-select__chevron';chevron.setAttribute('aria-hidden','true');
  trigger.append(value,chevron); wrapper.appendChild(trigger);
  select.classList.add('custom-select__native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  var panel=document.createElement('div');panel.className='custom-select__panel';panel.hidden=true;panel.dir='rtl';
  var search=document.createElement('input');search.type='search';search.className='custom-select__search';search.placeholder='ابحث في الخيارات';search.setAttribute('aria-label','ابحث في '+label);search.autocomplete='off';
  var list=document.createElement('div');list.className='custom-select__list';list.id=uid;list.setAttribute('role','listbox');list.setAttribute('aria-label',label);list.tabIndex=-1;
  var empty=document.createElement('p');empty.className='custom-select__empty';empty.textContent='ما فيه نتائج مطابقة';empty.hidden=true;
  panel.append(search,list,empty);
  (select.closest('dialog') || document.body).appendChild(panel);
  var buttons=[], highlighted=-1;
  var dialog=select.closest('dialog');if(dialog){dialog.addEventListener('close',close);}
  function sync() {
   var chosen=select.options[select.selectedIndex];value.textContent=chosen?chosen.textContent:'اختر';trigger.disabled=select.disabled;
   trigger.classList.toggle('is-placeholder',!select.value);
   if (select.validity.valid) { trigger.removeAttribute('aria-invalid'); }
   search.hidden=select.options.length<8;
  }
  function options() {
   sync();list.textContent='';buttons=[];var query=search.value.trim().toLocaleLowerCase('ar');
   Array.from(select.options).forEach(function(option,index){
    if (option.hidden || (query && !option.textContent.toLocaleLowerCase('ar').includes(query))) { return; }
    var button=document.createElement('button');button.type='button';button.className='custom-select__option';button.id=uid+'-option-'+index;button.tabIndex=-1;button.setAttribute('role','option');button.textContent=option.textContent;button.disabled=option.disabled || (option.parentElement.tagName==='OPTGROUP' && option.parentElement.disabled);button.setAttribute('aria-selected',String(index===select.selectedIndex));button.dataset.index=String(index);
    button.addEventListener('click',function(event){event.preventDefault();select.selectedIndex=index;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();trigger.focus();});
    list.appendChild(button);if (!button.disabled) { buttons.push(button); }
   });
   empty.hidden=buttons.length>0;highlighted=buttons.findIndex(function(button){return +button.dataset.index===select.selectedIndex;});
  }
  function position() {
   var r=trigger.getBoundingClientRect();if (!r.width) { close();return; }
   var viewport=window.visualViewport, viewportTop=viewport?viewport.offsetTop:0, viewportWidth=viewport?viewport.width:window.innerWidth, viewportBottom=viewportTop+(viewport?viewport.height:window.innerHeight);
   var gap=7, margin=12;
   var spaceBelow=viewportBottom-r.bottom-margin;
   var spaceAbove=r.top-viewportTop-margin;
   var below=spaceBelow>=180 || spaceBelow>=spaceAbove;
   var available=below?spaceBelow:spaceAbove;
   var rtl = getComputedStyle(document.documentElement).direction === 'rtl' || panel.dir === 'rtl';
   panel.style.width=Math.min(Math.max(r.width,190),viewportWidth-24)+'px';
   if (rtl) {
    panel.style.left='auto';
    panel.style.right=Math.min(Math.max(margin, viewportWidth - r.right - margin), viewportWidth - parseFloat(panel.style.width) - margin)+'px';
    panel.style.transform='none';
   } else {
    panel.style.right='auto';
    panel.style.left=Math.min(Math.max(margin,r.left),viewportWidth-parseFloat(panel.style.width)-margin)+'px';
    panel.style.transform='none';
   }
   panel.style.maxHeight=Math.min(320,Math.max(80,available-gap))+'px';
   if (below) { panel.style.top=(r.bottom+gap)+'px';panel.style.bottom='auto'; }
   else { panel.style.top='auto';panel.style.bottom=(window.innerHeight-r.top+gap)+'px'; }
  }
  function close() {panel.hidden=true;trigger.setAttribute('aria-expanded','false');wrapper.classList.remove('is-open');if (active && active.wrapper===wrapper) { active=null; }}
  function focusOption(index) {
   if (!buttons.length) { return; }highlighted=(index+buttons.length)%buttons.length;buttons[highlighted].focus();buttons[highlighted].scrollIntoView({block:'nearest'});
  }
  function open() {
   if (select.disabled) { return; }if (active) {active.close();}search.value='';options();panel.hidden=false;position();trigger.setAttribute('aria-expanded','true');wrapper.classList.add('is-open');active={wrapper:wrapper,panel:panel,close:close,position:position};
   if (!search.hidden) { search.focus(); } else { focusOption(highlighted<0?0:highlighted); }
  }
  trigger.addEventListener('click',function(event){event.preventDefault();panel.hidden?open():close();});
  trigger.addEventListener('keydown',function(event){if (['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();open();}if(event.key==='Escape'){close();}});
  panel.addEventListener('keydown',function(event){
   if(event.key==='Escape'){event.preventDefault();close();trigger.focus();return;}
   if(event.key==='Tab'){close();trigger.focus();return;}
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();focusOption(highlighted+(event.key==='ArrowDown'?1:-1));}
   if(event.key==='Home' && event.target!==search){event.preventDefault();focusOption(0);}
   if(event.key==='End' && event.target!==search){event.preventDefault();focusOption(buttons.length-1);}
  });
  search.addEventListener('input',options);select.addEventListener('change',sync);select.addEventListener('focus',function(){trigger.focus();});
  select.addEventListener('invalid',function(event){event.preventDefault();trigger.setAttribute('aria-invalid','true');trigger.focus();});
  if(select.form){select.form.addEventListener('reset',function(){setTimeout(function(){sync();close();},0);});}
  new MutationObserver(function(){options();if(!panel.hidden){position();}}).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','hidden','label','value']});
  options();
 }
 document.querySelectorAll('select').forEach(enhance);
 document.addEventListener('click',function(event){if(active&&!active.wrapper.contains(event.target)&&!active.panel.contains(event.target)){active.close();}});
 window.addEventListener('resize',function(){if(active){active.position();}});
 if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){if(active){active.position();}});window.visualViewport.addEventListener('scroll',function(){if(active){active.position();}});}
 document.addEventListener('scroll',function(){if(active){active.position();}},true);
 new MutationObserver(function(records){records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType!==1){return;}if(node.matches('select')){enhance(node);}node.querySelectorAll('select').forEach(enhance);});});}).observe(document.body,{childList:true,subtree:true});
})();
