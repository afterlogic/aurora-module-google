'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CUserSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.connected = ko.observable(Settings.Connected);
	this.scopes = ko.observable(Settings.getScopesCopy());
	this.bRunCallback = false;
	
	window.googleConnectCallback = _.bind(function (bResult, sErrorCode, sModule) {
		this.bRunCallback = true;
		
		if (!bResult)
		{
			Api.showErrorByCode({'ErrorCode': Types.pInt(sErrorCode), 'ErrorMessage': '', 'ErrorModule': sModule}, '', true);
		}
		else
		{
			this.connected(true);
			this.updateSavedState();
			Settings.updateScopes(this.connected(), this.scopes());
		}
	}, this);
}

_.extendOwn(CUserSettingsView.prototype, CAbstractSettingsFormView.prototype);

CUserSettingsView.prototype.ViewTemplate = '%ModuleName%_UserSettingsView';

/**
 * Returns current values of changeable parameters. These values are used to compare with their previous version.
 * @returns {Array}
 */
CUserSettingsView.prototype.getCurrentValues = function()
{
	var aScopesValues = _.map(this.scopes(), function (oScope) {
		return oScope.Name + oScope.Value();
	});
	return [
		this.connected(),
		aScopesValues
	];
};

/**
 * Reverts values of changeable parameters to default ones.
 */
CUserSettingsView.prototype.revertGlobalValues = function()
{
	this.connected(Settings.Connected);
	this.scopes(Settings.getScopesCopy());
};

/**
 * Checks if connect is allowed and tries to connect in that case.
 */
CUserSettingsView.prototype.checkAndConnect = function ()
{
	var
		oParams = {
			'Scopes': [],
			'Service': 'google',
			'AllowConnect': true
		},
		oAuthScope = _.find(this.scopes(), function (oScope) {
			return oScope.Name === 'auth';
		})
	;
	_.each(this.scopes(), function (oScope) {
		if (oScope.Value())
		{
			oParams.Scopes.push(oScope.Name);
		}
	});
	
	App.broadcastEvent('OAuthAccountChange::before', oParams);
	
	if (oParams.AllowConnect && (oAuthScope && oAuthScope.Value() || App.isAccountDeletingAvaliable()))
	{
		this.connect(oParams.Scopes);
	}
};

/**
 * Tries to connect user to google account.
 * @param {array} aScopes
 */
CUserSettingsView.prototype.connect = function (aScopes)
{
	$.removeCookie('oauth-scopes');
	$.cookie('oauth-scopes', aScopes.join('|'));
	$.cookie('oauth-redirect', 'connect');
	this.bRunCallback = false;
	var
		oWin = WindowOpener.open(UrlUtils.getAppPath() + '?oauth=google', 'Google'),
		iIntervalId = setInterval(_.bind(function() {
			if (oWin.closed)
			{
				if (!this.bRunCallback)
				{
					window.location.reload();
				}
				else
				{
					clearInterval(iIntervalId);
					App.broadcastEvent('OAuthAccountChange::after');
					this.updateSavedState();
					Settings.updateScopes(this.connected(), this.scopes());
				}
			}
		}, this), 1000)
	;
};

/**
 * Checks if disconnect is allowed and disconnects in that case.
 */
CUserSettingsView.prototype.checkAndDisconnect = function ()
{
	var
		oParams = {
			'Service': 'google',
			'AllowDisconnect': true
		}
	;
	
	App.broadcastEvent('OAuthAccountChange::before', oParams);
	
	if (oParams.AllowDisconnect && App.isAccountDeletingAvaliable())
	{
		this.disconnect();
	}
};

/**
 * Disconnects user from google account.
 */
CUserSettingsView.prototype.disconnect = function ()
{
	Ajax.send(Settings.ServerModuleName, 'DeleteAccount', null, function (oResponse) {
		if (oResponse.Result)
		{
			this.connected(false);
			_.each(this.scopes(), function (oScope) {
				oScope.Value(false);
			});
			App.broadcastEvent('OAuthAccountChange::after');
		}
		else
		{
			Api.showErrorByCode(oResponse, '', true);
		}
	}, this);
};

module.exports = new CUserSettingsView();
