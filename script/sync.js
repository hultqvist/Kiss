﻿var syncActionPrefix = "action:";

loadAll();

function loadAll()
{
	if(useChromeSync)
	{
		chrome.storage.sync.get(null, function(list){ 
			if(chrome.runtime.lastError)
			{
				syncError();
				return;
			}

			if(list.filters != null)
			{
				console.log("Filters: loaded legacy");
			
				//Legacy filters
				filters = JSON.parse(list.filters);
				prepareFilters();
				fixLegacyWildcard();
				return;
			}

			//console.log("Filters: loaded", list);
			filters = {};
			actions = {};
			importAll(list);
		});
	}
	else
	{
		loadLocalSettings();
		loadLocalActions();
		loadLocalFilters();
	}
}

function importAll(list)
{
	for(var k in list)
	{
		var c = list[k];

		//Settings
		if(k == "settings")
		{
			settings = c;
			continue;
		}
		//Actions
		if(k.indexOf(syncActionPrefix) == 0)
		{
			var action = k.substring(syncActionPrefix.length);
			actions[action] = c;
			continue;
		}

		//Filters
		var sep = k.indexOf(filterFromToSeparator);
		if(sep >= 0)
		{
			c.from = k.substring(0, sep);
			c.to = k.substring(sep + filterFromToSeparator.length);
			addFilter(c);
		}

		//Unknown
		console.log("Error, unkonwn key", k, c)
	}
	prepareFilters();
}

	
chrome.storage.onChanged.addListener(function(changed, namespace)
{
	if(namespace != "sync")
		return;
	if(!useChromeSync)
		return;

	for(var k in changed)
	{
		var c = changed[k];
		if(k.indexOf(syncActionPrefix) == 0)
		{
			var action = k.substring(syncActionPrefix.length);
			if(c.oldValue)
			{
				delete actions[action];
			}
			if(c.newValue)
			{
				actions[action] = c.newValue;
			}
			continue;
		}
		var sep = k.indexOf(filterFromToSeparator);
		if(sep >= 0)
		{
			var from = k.substring(0, sep);
			var to = k.substring(sep + filterFromToSeparator.length);
			if(c.oldValue)
			{
				deleteFilter(from, to);
			}
			if(c.newValue)
			{
				var f = c.newValue;
				f.from = from;
				f.to = to;
				addFilter(f);
			}
			continue;
		}
		if(k == "settings")
		{
			if(c.newValue)
				settings = c.newValue;
			continue;
		}
		//Unknown storage key
		console.log("Error, unknown sync storage key", k, c);
	}
});

//Delete single filter item from sync storage
function syncDeleteFilter(from, to)
{
	syncDelete(from + filterFromToSeparator + to);
}

//Delete single action
function syncDeleteAction(action)
{
	syncDelete(syncActionPrefix + action);
}

//Delete single action
function syncDelete(key)
{
	if(useChromeSync)
	{
		chrome.storage.sync.remove(key, syncError);
	}
	else
	{
		saveAll();
	}
}

function syncUpdateFilter(filter)
{
	syncUpdate(
		filter.from + filterFromToSeparator + filter.to, 
		generateExportItem(filter));
}

function syncUpdateAction(action, config)
{
	syncUpdate(syncActionPrefix + action, config);
}

function syncUpdateSettings()
{
	syncUpdate("settings", settings);
}

function syncUpdate(key, value)
{
	if(useChromeSync)
	{
		var i = {};
		i[key] = value;
		chrome.storage.sync.set(i, syncError);
	}
	else
	{
		saveAll();
	}
}