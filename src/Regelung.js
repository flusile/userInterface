$(function() 
{
	// für alle als class tab markierten Elemente 
	$(".tabs").each(function() 
	{
		var header = $('<ul class="tabs-header"></ul>')
        var content = $('<div class="tabs-content"></div>')
        $(this).prepend(header)
        header.after(content)
        $(this).children('.tab').each(function(i) 
		{
            var label = $(this).children('.tab-label')
            var tab = $('<li class="tab"/>')
            header.append(tab)
            tab.text(label.text())
            label.remove()
            content.append($(this))
			
			// hinterlege als HyperLink die Auswahl des entsprechenden Tabs.
			// Es schadet nicht, die Funktion später zu definieren.
            tab.click(function() { selectTab(i) })
        })
		
        function selectTab(i) 
		{
			// hole alle als tab markierten Elemente
            var tabs = header.children()
			
			// markiere sie als "not selected"
            tabs.removeClass('selected')
			
			// das angeforderte Element sei jetzt "selcted"
            $(tabs[i]).addClass('selected')
			
			// hole dann alle Childelemente
            var contents = content.children()
			
			// mach sie unsichtbar
            contents.hide()
			
			// und mache sichtbar nur das ausgewählte
            $(contents[i]).show()
        }
        
		// Initial wird tab 0 angezeigt.
		selectTab(0)
		//content.children().hide()
    })
})
