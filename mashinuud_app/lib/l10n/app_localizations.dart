import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_mn.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('mn'),
  ];

  /// No description provided for @yes.
  ///
  /// In en, this message translates to:
  /// **'Yes'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In en, this message translates to:
  /// **'No'**
  String get no;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @payment.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get payment;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @contact.
  ///
  /// In en, this message translates to:
  /// **'Contact us'**
  String get contact;

  /// No description provided for @notification.
  ///
  /// In en, this message translates to:
  /// **'Notification'**
  String get notification;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'First name'**
  String get name;

  /// No description provided for @last_name.
  ///
  /// In en, this message translates to:
  /// **'Last name'**
  String get last_name;

  /// No description provided for @male.
  ///
  /// In en, this message translates to:
  /// **'Male'**
  String get male;

  /// No description provided for @female.
  ///
  /// In en, this message translates to:
  /// **'Female'**
  String get female;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @remember_name.
  ///
  /// In en, this message translates to:
  /// **'Remember login name'**
  String get remember_name;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @forgot_password.
  ///
  /// In en, this message translates to:
  /// **'Forgot password'**
  String get forgot_password;

  /// No description provided for @or.
  ///
  /// In en, this message translates to:
  /// **'Or'**
  String get or;

  /// No description provided for @login_with.
  ///
  /// In en, this message translates to:
  /// **'login with SNS account'**
  String get login_with;

  /// No description provided for @create_new_acc.
  ///
  /// In en, this message translates to:
  /// **'Create new account'**
  String get create_new_acc;

  /// No description provided for @create_account.
  ///
  /// In en, this message translates to:
  /// **'Create an account'**
  String get create_account;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email address'**
  String get email;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @set_password.
  ///
  /// In en, this message translates to:
  /// **'Create password'**
  String get set_password;

  /// No description provided for @re_enter_pass.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get re_enter_pass;

  /// No description provided for @terms.
  ///
  /// In en, this message translates to:
  /// **'Terms of service'**
  String get terms;

  /// No description provided for @accept_terms.
  ///
  /// In en, this message translates to:
  /// **'Accept terms'**
  String get accept_terms;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @payment_status.
  ///
  /// In en, this message translates to:
  /// **'Payment status'**
  String get payment_status;

  /// No description provided for @recommended.
  ///
  /// In en, this message translates to:
  /// **'Recommended:'**
  String get recommended;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @basic_info.
  ///
  /// In en, this message translates to:
  /// **'Basic information'**
  String get basic_info;

  /// No description provided for @creator.
  ///
  /// In en, this message translates to:
  /// **'Creator'**
  String get creator;

  /// No description provided for @customer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get customer;

  /// No description provided for @creator_desc.
  ///
  /// In en, this message translates to:
  /// **'（Order side）'**
  String get creator_desc;

  /// No description provided for @customer_desc.
  ///
  /// In en, this message translates to:
  /// **'（Requester）'**
  String get customer_desc;

  /// No description provided for @my_page.
  ///
  /// In en, this message translates to:
  /// **'My page'**
  String get my_page;

  /// No description provided for @change_password.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get change_password;

  /// No description provided for @current_password.
  ///
  /// In en, this message translates to:
  /// **'Current password'**
  String get current_password;

  /// No description provided for @new_password.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get new_password;

  /// No description provided for @re_enter_new_pass.
  ///
  /// In en, this message translates to:
  /// **'Re-enter new password'**
  String get re_enter_new_pass;

  /// No description provided for @update_password.
  ///
  /// In en, this message translates to:
  /// **'Update password'**
  String get update_password;

  /// No description provided for @switch_to_customer_account.
  ///
  /// In en, this message translates to:
  /// **'Switch to customer account'**
  String get switch_to_customer_account;

  /// No description provided for @switch_to_creator_account.
  ///
  /// In en, this message translates to:
  /// **'Switch to creator account'**
  String get switch_to_creator_account;

  /// No description provided for @please_wait.
  ///
  /// In en, this message translates to:
  /// **'Please wait 。。。'**
  String get please_wait;

  /// No description provided for @please_fill.
  ///
  /// In en, this message translates to:
  /// **'Please fill'**
  String get please_fill;

  /// No description provided for @please_check_internet.
  ///
  /// In en, this message translates to:
  /// **'Please check internet connection'**
  String get please_check_internet;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @age.
  ///
  /// In en, this message translates to:
  /// **'Age'**
  String get age;

  /// No description provided for @prefectures.
  ///
  /// In en, this message translates to:
  /// **'Prefectures'**
  String get prefectures;

  /// No description provided for @street_address.
  ///
  /// In en, this message translates to:
  /// **'Street address'**
  String get street_address;

  /// No description provided for @work_place.
  ///
  /// In en, this message translates to:
  /// **'Work place'**
  String get work_place;

  /// No description provided for @cellphone_number.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get cellphone_number;

  /// No description provided for @credentials.
  ///
  /// In en, this message translates to:
  /// **'Credentials'**
  String get credentials;

  /// No description provided for @occupations.
  ///
  /// In en, this message translates to:
  /// **'Occupation'**
  String get occupations;

  /// No description provided for @experience.
  ///
  /// In en, this message translates to:
  /// **'Experience'**
  String get experience;

  /// No description provided for @individuals_or_companies.
  ///
  /// In en, this message translates to:
  /// **'Individual or company'**
  String get individuals_or_companies;

  /// No description provided for @self_introduction_fill.
  ///
  /// In en, this message translates to:
  /// **'Self introduction'**
  String get self_introduction_fill;

  /// No description provided for @skill.
  ///
  /// In en, this message translates to:
  /// **'Skill'**
  String get skill;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @upload_license_photos.
  ///
  /// In en, this message translates to:
  /// **'Upload license photos'**
  String get upload_license_photos;

  /// No description provided for @upload_license.
  ///
  /// In en, this message translates to:
  /// **'\nUpload\nlicense\nphoto'**
  String get upload_license;

  /// No description provided for @license_required.
  ///
  /// In en, this message translates to:
  /// **'License photos required'**
  String get license_required;

  /// No description provided for @individual.
  ///
  /// In en, this message translates to:
  /// **'Individual'**
  String get individual;

  /// No description provided for @corporation.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get corporation;

  /// No description provided for @the_company.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get the_company;

  /// No description provided for @senior_technician.
  ///
  /// In en, this message translates to:
  /// **'Senior technician'**
  String get senior_technician;

  /// No description provided for @general_technician.
  ///
  /// In en, this message translates to:
  /// **'General technician'**
  String get general_technician;

  /// No description provided for @female_technician.
  ///
  /// In en, this message translates to:
  /// **'Female technician'**
  String get female_technician;

  /// No description provided for @diy_experience.
  ///
  /// In en, this message translates to:
  /// **'DIY experience'**
  String get diy_experience;

  /// No description provided for @job_selection.
  ///
  /// In en, this message translates to:
  /// **'Select job'**
  String get job_selection;

  /// No description provided for @carpentry_woodworking.
  ///
  /// In en, this message translates to:
  /// **'Carpentry woodworking'**
  String get carpentry_woodworking;

  /// No description provided for @plastering.
  ///
  /// In en, this message translates to:
  /// **'Plastering'**
  String get plastering;

  /// No description provided for @jump_earthwork_and_concrete_work.
  ///
  /// In en, this message translates to:
  /// **'Jump earthwork and concrete work'**
  String get jump_earthwork_and_concrete_work;

  /// No description provided for @stone_construction.
  ///
  /// In en, this message translates to:
  /// **'Stone construction'**
  String get stone_construction;

  /// No description provided for @roof_construction.
  ///
  /// In en, this message translates to:
  /// **'Roof construction'**
  String get roof_construction;

  /// No description provided for @electrical_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Electrical construction work'**
  String get electrical_construction_work;

  /// No description provided for @tube_construction.
  ///
  /// In en, this message translates to:
  /// **'Tube construction'**
  String get tube_construction;

  /// No description provided for @tile_brick_block_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Tile brick block construction work'**
  String get tile_brick_block_construction_work;

  /// No description provided for @steel_structures_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Steel structures construction work'**
  String get steel_structures_construction_work;

  /// No description provided for @rebar_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Rebar construction work'**
  String get rebar_construction_work;

  /// No description provided for @paving_construction.
  ///
  /// In en, this message translates to:
  /// **'Paving construction'**
  String get paving_construction;

  /// No description provided for @dredging_work.
  ///
  /// In en, this message translates to:
  /// **'Dredging work'**
  String get dredging_work;

  /// No description provided for @sheet_metal_work.
  ///
  /// In en, this message translates to:
  /// **'Sheet metal work'**
  String get sheet_metal_work;

  /// No description provided for @glass_works.
  ///
  /// In en, this message translates to:
  /// **'Glass work'**
  String get glass_works;

  /// No description provided for @painting_work.
  ///
  /// In en, this message translates to:
  /// **'Painting work'**
  String get painting_work;

  /// No description provided for @roofing_contractors.
  ///
  /// In en, this message translates to:
  /// **'Roofing contractors'**
  String get roofing_contractors;

  /// No description provided for @interior_finish_work.
  ///
  /// In en, this message translates to:
  /// **'Interior finish work'**
  String get interior_finish_work;

  /// No description provided for @machinery_and_equipment_installation_work.
  ///
  /// In en, this message translates to:
  /// **'Machinery and equipment installation work'**
  String get machinery_and_equipment_installation_work;

  /// No description provided for @thermal_insulation_work.
  ///
  /// In en, this message translates to:
  /// **'Thermal insulation work'**
  String get thermal_insulation_work;

  /// No description provided for @telecommunications_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Telecommunications construction work'**
  String get telecommunications_construction_work;

  /// No description provided for @landscaping_work.
  ///
  /// In en, this message translates to:
  /// **'Landscaping work'**
  String get landscaping_work;

  /// No description provided for @well_sinking_well_drilling_construction.
  ///
  /// In en, this message translates to:
  /// **'Well sinking well drilling construction'**
  String get well_sinking_well_drilling_construction;

  /// No description provided for @joinery_work.
  ///
  /// In en, this message translates to:
  /// **'Joinery work'**
  String get joinery_work;

  /// No description provided for @water_facilities_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Water facilities construction work'**
  String get water_facilities_construction_work;

  /// No description provided for @fire_fighting_facilities_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Fire fighting facilities construction work'**
  String get fire_fighting_facilities_construction_work;

  /// No description provided for @cleaning_facilities_construction_work.
  ///
  /// In en, this message translates to:
  /// **'Cleaning facilities construction work'**
  String get cleaning_facilities_construction_work;

  /// No description provided for @demolition_work.
  ///
  /// In en, this message translates to:
  /// **'Demolition work'**
  String get demolition_work;

  /// No description provided for @select_a_photo.
  ///
  /// In en, this message translates to:
  /// **'Select photo'**
  String get select_a_photo;

  /// No description provided for @photograph.
  ///
  /// In en, this message translates to:
  /// **'Take picture'**
  String get photograph;

  /// No description provided for @alert_info_saved.
  ///
  /// In en, this message translates to:
  /// **'Information has been saved'**
  String get alert_info_saved;

  /// No description provided for @recommended_work.
  ///
  /// In en, this message translates to:
  /// **'Recommended work:'**
  String get recommended_work;

  /// No description provided for @negotiation_work.
  ///
  /// In en, this message translates to:
  /// **'Negotiation work:'**
  String get negotiation_work;

  /// No description provided for @approved_work.
  ///
  /// In en, this message translates to:
  /// **'Approved work:'**
  String get approved_work;

  /// No description provided for @company_work.
  ///
  /// In en, this message translates to:
  /// **'Company work:'**
  String get company_work;

  /// No description provided for @job_detail.
  ///
  /// In en, this message translates to:
  /// **'Job detail'**
  String get job_detail;

  /// No description provided for @registration_date.
  ///
  /// In en, this message translates to:
  /// **'Registration date'**
  String get registration_date;

  /// No description provided for @year.
  ///
  /// In en, this message translates to:
  /// **'Year'**
  String get year;

  /// No description provided for @month.
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get month;

  /// No description provided for @day.
  ///
  /// In en, this message translates to:
  /// **'Day'**
  String get day;

  /// No description provided for @hour.
  ///
  /// In en, this message translates to:
  /// **'Hour'**
  String get hour;

  /// No description provided for @minute.
  ///
  /// In en, this message translates to:
  /// **'Minute'**
  String get minute;

  /// No description provided for @work_id.
  ///
  /// In en, this message translates to:
  /// **'Work ID'**
  String get work_id;

  /// No description provided for @work_history.
  ///
  /// In en, this message translates to:
  /// **'Work history'**
  String get work_history;

  /// No description provided for @urgency.
  ///
  /// In en, this message translates to:
  /// **'Urgency'**
  String get urgency;

  /// No description provided for @city.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// No description provided for @floor_plan.
  ///
  /// In en, this message translates to:
  /// **'Floor plan'**
  String get floor_plan;

  /// No description provided for @aging.
  ///
  /// In en, this message translates to:
  /// **'Aging'**
  String get aging;

  /// No description provided for @building_type.
  ///
  /// In en, this message translates to:
  /// **'Building type'**
  String get building_type;

  /// No description provided for @comment.
  ///
  /// In en, this message translates to:
  /// **'Comment'**
  String get comment;

  /// No description provided for @customer_name.
  ///
  /// In en, this message translates to:
  /// **'Customer name'**
  String get customer_name;

  /// No description provided for @start_date.
  ///
  /// In en, this message translates to:
  /// **'Start date'**
  String get start_date;

  /// No description provided for @end_date.
  ///
  /// In en, this message translates to:
  /// **'End date'**
  String get end_date;

  /// No description provided for @days.
  ///
  /// In en, this message translates to:
  /// **'Days'**
  String get days;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @proposed_amount.
  ///
  /// In en, this message translates to:
  /// **'Proposed amount'**
  String get proposed_amount;

  /// No description provided for @proposal_amount.
  ///
  /// In en, this message translates to:
  /// **'Proposal amount'**
  String get proposal_amount;

  /// No description provided for @proposal.
  ///
  /// In en, this message translates to:
  /// **'Proposal'**
  String get proposal;

  /// No description provided for @ask.
  ///
  /// In en, this message translates to:
  /// **'Ask'**
  String get ask;

  /// No description provided for @profile_information_ask.
  ///
  /// In en, this message translates to:
  /// **'Profile details needed, do you want to enter？'**
  String get profile_information_ask;

  /// No description provided for @referral_information.
  ///
  /// In en, this message translates to:
  /// **'Referral information'**
  String get referral_information;

  /// No description provided for @old_password.
  ///
  /// In en, this message translates to:
  /// **'Old password'**
  String get old_password;

  /// No description provided for @confirm_new_password.
  ///
  /// In en, this message translates to:
  /// **'Confirm new password'**
  String get confirm_new_password;

  /// No description provided for @prefecture.
  ///
  /// In en, this message translates to:
  /// **'Prefecture'**
  String get prefecture;

  /// No description provided for @dob.
  ///
  /// In en, this message translates to:
  /// **'Date of birth'**
  String get dob;

  /// No description provided for @user_information.
  ///
  /// In en, this message translates to:
  /// **'User information'**
  String get user_information;

  /// No description provided for @photo.
  ///
  /// In en, this message translates to:
  /// **'Photo'**
  String get photo;

  /// No description provided for @retake.
  ///
  /// In en, this message translates to:
  /// **'Retake'**
  String get retake;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @use.
  ///
  /// In en, this message translates to:
  /// **'Use'**
  String get use;

  /// No description provided for @newworkrequest.
  ///
  /// In en, this message translates to:
  /// **'New Work Request'**
  String get newworkrequest;

  /// No description provided for @addphoto.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get addphoto;

  /// No description provided for @title.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get title;

  /// No description provided for @who_do_you_send_it_to.
  ///
  /// In en, this message translates to:
  /// **'Who do you send it to?'**
  String get who_do_you_send_it_to;

  /// No description provided for @send_new_task.
  ///
  /// In en, this message translates to:
  /// **'Send new task'**
  String get send_new_task;

  /// No description provided for @save_as_draft.
  ///
  /// In en, this message translates to:
  /// **'Save as draft'**
  String get save_as_draft;

  /// No description provided for @select.
  ///
  /// In en, this message translates to:
  /// **'Select'**
  String get select;

  /// No description provided for @deletephoto.
  ///
  /// In en, this message translates to:
  /// **'Delete photo'**
  String get deletephoto;

  /// No description provided for @the_transmission_of_the_new_task.
  ///
  /// In en, this message translates to:
  /// **'Send new task'**
  String get the_transmission_of_the_new_task;

  /// No description provided for @save_it_as_a_draft.
  ///
  /// In en, this message translates to:
  /// **'Save as draft'**
  String get save_it_as_a_draft;

  /// No description provided for @select_a_photo_category.
  ///
  /// In en, this message translates to:
  /// **'Select a photo category'**
  String get select_a_photo_category;

  /// No description provided for @near.
  ///
  /// In en, this message translates to:
  /// **'Near'**
  String get near;

  /// No description provided for @far.
  ///
  /// In en, this message translates to:
  /// **'Far away'**
  String get far;

  /// No description provided for @not_in_a_hurry.
  ///
  /// In en, this message translates to:
  /// **'Not in a hurry'**
  String get not_in_a_hurry;

  /// No description provided for @usually.
  ///
  /// In en, this message translates to:
  /// **'Usually'**
  String get usually;

  /// No description provided for @it_is_in_a_hurry.
  ///
  /// In en, this message translates to:
  /// **'It is in a hurry'**
  String get it_is_in_a_hurry;

  /// No description provided for @update_work.
  ///
  /// In en, this message translates to:
  /// **'Update a work'**
  String get update_work;

  /// No description provided for @postal_code.
  ///
  /// In en, this message translates to:
  /// **'Postal code'**
  String get postal_code;

  /// No description provided for @registration_status.
  ///
  /// In en, this message translates to:
  /// **'Registration status'**
  String get registration_status;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @please_fill_the_inquiry_here.
  ///
  /// In en, this message translates to:
  /// **'Please fill the inquiry here'**
  String get please_fill_the_inquiry_here;

  /// No description provided for @your_inquiry_was_submitted_successfully.
  ///
  /// In en, this message translates to:
  /// **'Your inquiry submitted successfully'**
  String get your_inquiry_was_submitted_successfully;

  /// No description provided for @see_all.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get see_all;

  /// No description provided for @referral_company.
  ///
  /// In en, this message translates to:
  /// **'Referral company'**
  String get referral_company;

  /// No description provided for @work_registered.
  ///
  /// In en, this message translates to:
  /// **'The work request has been registered.'**
  String get work_registered;

  /// No description provided for @suggestion_list.
  ///
  /// In en, this message translates to:
  /// **'Suggestion list'**
  String get suggestion_list;

  /// No description provided for @proposal_details.
  ///
  /// In en, this message translates to:
  /// **'Proposal details'**
  String get proposal_details;

  /// No description provided for @available_dates.
  ///
  /// In en, this message translates to:
  /// **'Available dates'**
  String get available_dates;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @show_details.
  ///
  /// In en, this message translates to:
  /// **'Show details'**
  String get show_details;

  /// No description provided for @agree.
  ///
  /// In en, this message translates to:
  /// **'Agree'**
  String get agree;

  /// No description provided for @refuse.
  ///
  /// In en, this message translates to:
  /// **'Refuse'**
  String get refuse;

  /// No description provided for @do_you_approve_this_proposal.
  ///
  /// In en, this message translates to:
  /// **'Do you approve this proposal?'**
  String get do_you_approve_this_proposal;

  /// No description provided for @do_you_refuce_this_proposal.
  ///
  /// In en, this message translates to:
  /// **'Would you like to reject this proposal?'**
  String get do_you_refuce_this_proposal;

  /// No description provided for @do_you_cancel_this_proposal.
  ///
  /// In en, this message translates to:
  /// **'Would you like to cancel this proposal?'**
  String get do_you_cancel_this_proposal;

  /// No description provided for @do_you_confirm_to_cancel_this_proposal.
  ///
  /// In en, this message translates to:
  /// **'Would you like to confirm to cancel this proposal?'**
  String get do_you_confirm_to_cancel_this_proposal;

  /// No description provided for @draft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get draft;

  /// No description provided for @open.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get open;

  /// No description provided for @negotiations.
  ///
  /// In en, this message translates to:
  /// **'Negotiations'**
  String get negotiations;

  /// No description provided for @refused.
  ///
  /// In en, this message translates to:
  /// **'Refused'**
  String get refused;

  /// No description provided for @requested.
  ///
  /// In en, this message translates to:
  /// **'Requested'**
  String get requested;

  /// No description provided for @request.
  ///
  /// In en, this message translates to:
  /// **'Request'**
  String get request;

  /// No description provided for @approved.
  ///
  /// In en, this message translates to:
  /// **'Approved '**
  String get approved;

  /// No description provided for @paid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get paid;

  /// No description provided for @canceled.
  ///
  /// In en, this message translates to:
  /// **'Canceled'**
  String get canceled;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @profile_information.
  ///
  /// In en, this message translates to:
  /// **'Profile information'**
  String get profile_information;

  /// No description provided for @registered_email.
  ///
  /// In en, this message translates to:
  /// **'Registered email'**
  String get registered_email;

  /// No description provided for @invalid_email.
  ///
  /// In en, this message translates to:
  /// **'Invalid email'**
  String get invalid_email;

  /// No description provided for @reset_password.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get reset_password;

  /// No description provided for @reset_code.
  ///
  /// In en, this message translates to:
  /// **'Reset code'**
  String get reset_code;

  /// No description provided for @accept.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get accept;

  /// No description provided for @do_you_approve_proposal.
  ///
  /// In en, this message translates to:
  /// **'Do you approve this proposal？'**
  String get do_you_approve_proposal;

  /// No description provided for @proposal_approved.
  ///
  /// In en, this message translates to:
  /// **'The proposal has been approved'**
  String get proposal_approved;

  /// No description provided for @proposal_refused.
  ///
  /// In en, this message translates to:
  /// **'The proposal has been rejected.'**
  String get proposal_refused;

  /// No description provided for @proposal_canceling.
  ///
  /// In en, this message translates to:
  /// **'The proposal canceling.'**
  String get proposal_canceling;

  /// No description provided for @status2.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status2;

  /// No description provided for @work_progress.
  ///
  /// In en, this message translates to:
  /// **'Work progress'**
  String get work_progress;

  /// No description provided for @waiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting'**
  String get waiting;

  /// No description provided for @selected.
  ///
  /// In en, this message translates to:
  /// **'Selected'**
  String get selected;

  /// No description provided for @rating.
  ///
  /// In en, this message translates to:
  /// **'Rating'**
  String get rating;

  /// No description provided for @send_rating.
  ///
  /// In en, this message translates to:
  /// **'Send rating'**
  String get send_rating;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @did_you_pay.
  ///
  /// In en, this message translates to:
  /// **'Did you pay?'**
  String get did_you_pay;

  /// No description provided for @did_you_rate.
  ///
  /// In en, this message translates to:
  /// **'The work is completed. Please rate.'**
  String get did_you_rate;

  /// No description provided for @rate_submitted.
  ///
  /// In en, this message translates to:
  /// **'Evaluation has been submitted.'**
  String get rate_submitted;

  /// No description provided for @want_to_change.
  ///
  /// In en, this message translates to:
  /// **'Do you want to change it？'**
  String get want_to_change;

  /// No description provided for @upload_after_photo.
  ///
  /// In en, this message translates to:
  /// **'Upload after photos'**
  String get upload_after_photo;

  /// No description provided for @add_photo.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get add_photo;

  /// No description provided for @customer_paid.
  ///
  /// In en, this message translates to:
  /// **'Did the customer pay？'**
  String get customer_paid;

  /// No description provided for @work_completed.
  ///
  /// In en, this message translates to:
  /// **'The work has completed'**
  String get work_completed;

  /// No description provided for @work_cancelled.
  ///
  /// In en, this message translates to:
  /// **'Canceled'**
  String get work_cancelled;

  /// No description provided for @construction_amount.
  ///
  /// In en, this message translates to:
  /// **'Construction amount'**
  String get construction_amount;

  /// No description provided for @payment_status_from_customer.
  ///
  /// In en, this message translates to:
  /// **'Payment status from customer'**
  String get payment_status_from_customer;

  /// No description provided for @payment_status_to_otasuke.
  ///
  /// In en, this message translates to:
  /// **'Payment status to OTASUKE'**
  String get payment_status_to_otasuke;

  /// No description provided for @otasuke_payment.
  ///
  /// In en, this message translates to:
  /// **'OTASUKE payment'**
  String get otasuke_payment;

  /// No description provided for @payment_status_to_innoichi.
  ///
  /// In en, this message translates to:
  /// **'イノイチへ支払い状況'**
  String get payment_status_to_innoichi;

  /// No description provided for @innoichi_payment.
  ///
  /// In en, this message translates to:
  /// **'イノイチの支払い'**
  String get innoichi_payment;

  /// No description provided for @incomplete.
  ///
  /// In en, this message translates to:
  /// **'Incomplete'**
  String get incomplete;

  /// No description provided for @received.
  ///
  /// In en, this message translates to:
  /// **'Received'**
  String get received;

  /// No description provided for @confirm_cancel.
  ///
  /// In en, this message translates to:
  /// **'Confirm cancel'**
  String get confirm_cancel;

  /// No description provided for @new_passwords_do_not_match.
  ///
  /// In en, this message translates to:
  /// **'New passwords do not match'**
  String get new_passwords_do_not_match;

  /// No description provided for @password_changed_successfully.
  ///
  /// In en, this message translates to:
  /// **'Password changed successfully'**
  String get password_changed_successfully;

  /// No description provided for @before.
  ///
  /// In en, this message translates to:
  /// **'Before'**
  String get before;

  /// No description provided for @after.
  ///
  /// In en, this message translates to:
  /// **'After'**
  String get after;

  /// No description provided for @your_review.
  ///
  /// In en, this message translates to:
  /// **'Your review'**
  String get your_review;

  /// No description provided for @continue_proposal.
  ///
  /// In en, this message translates to:
  /// **'Continue proposal'**
  String get continue_proposal;

  /// No description provided for @fill_information.
  ///
  /// In en, this message translates to:
  /// **'please fill in your required information'**
  String get fill_information;

  /// No description provided for @location.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// No description provided for @participation_in_customer.
  ///
  /// In en, this message translates to:
  /// **'Participation in this customer\'s work:'**
  String get participation_in_customer;

  /// No description provided for @required.
  ///
  /// In en, this message translates to:
  /// **'required'**
  String get required;

  /// No description provided for @optional.
  ///
  /// In en, this message translates to:
  /// **'optional'**
  String get optional;

  /// No description provided for @fee_paid.
  ///
  /// In en, this message translates to:
  /// **'Did you transfer to OTASUKE？'**
  String get fee_paid;

  /// No description provided for @empty_result.
  ///
  /// In en, this message translates to:
  /// **'Empty result'**
  String get empty_result;

  /// No description provided for @self_information.
  ///
  /// In en, this message translates to:
  /// **'Self information'**
  String get self_information;

  /// No description provided for @delete_image.
  ///
  /// In en, this message translates to:
  /// **'Do you want to delete this image？'**
  String get delete_image;

  /// No description provided for @confirmation_code.
  ///
  /// In en, this message translates to:
  /// **'Confirmation code'**
  String get confirmation_code;

  /// No description provided for @other_address_registration.
  ///
  /// In en, this message translates to:
  /// **'Other address registration'**
  String get other_address_registration;

  /// No description provided for @my_address.
  ///
  /// In en, this message translates to:
  /// **'My address'**
  String get my_address;

  /// No description provided for @other_address.
  ///
  /// In en, this message translates to:
  /// **'Other addresses'**
  String get other_address;

  /// No description provided for @calendar.
  ///
  /// In en, this message translates to:
  /// **'Calendar'**
  String get calendar;

  /// No description provided for @continu.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continu;

  /// No description provided for @attention.
  ///
  /// In en, this message translates to:
  /// **'Attention'**
  String get attention;

  /// No description provided for @do_u_want_to_leave.
  ///
  /// In en, this message translates to:
  /// **'Please note that the information you have entered will be deleted. Do you want to leave?'**
  String get do_u_want_to_leave;

  /// No description provided for @fill_title.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Title.'**
  String get fill_title;

  /// No description provided for @fill_dates.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Dates.'**
  String get fill_dates;

  /// No description provided for @fill_urgency.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Urgency.'**
  String get fill_urgency;

  /// No description provided for @fill_address.
  ///
  /// In en, this message translates to:
  /// **'You have to choose Address.'**
  String get fill_address;

  /// No description provided for @fill_floor_plan.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Floor plan.'**
  String get fill_floor_plan;

  /// No description provided for @fill_building_age.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Building age.'**
  String get fill_building_age;

  /// No description provided for @fill_building_type.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Building type.'**
  String get fill_building_type;

  /// No description provided for @fill_comment.
  ///
  /// In en, this message translates to:
  /// **'You have to fill Comment.'**
  String get fill_comment;

  /// No description provided for @fillfield.
  ///
  /// In en, this message translates to:
  /// **'Fill field'**
  String get fillfield;

  /// No description provided for @choosefield.
  ///
  /// In en, this message translates to:
  /// **'Choose field'**
  String get choosefield;

  /// No description provided for @address.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get address;

  /// No description provided for @shotdifferentplace.
  ///
  /// In en, this message translates to:
  /// **'Take photos in another place'**
  String get shotdifferentplace;

  /// No description provided for @finished.
  ///
  /// In en, this message translates to:
  /// **'Finished'**
  String get finished;

  /// No description provided for @no_address_in_postcode.
  ///
  /// In en, this message translates to:
  /// **'There is no address in the postcode.'**
  String get no_address_in_postcode;

  /// No description provided for @are_you_sure.
  ///
  /// In en, this message translates to:
  /// **'Are you sure？'**
  String get are_you_sure;

  /// No description provided for @my_desired_date.
  ///
  /// In en, this message translates to:
  /// **'My desired date'**
  String get my_desired_date;

  /// No description provided for @other_desired_date.
  ///
  /// In en, this message translates to:
  /// **'The other party\'s desired date'**
  String get other_desired_date;

  /// No description provided for @width.
  ///
  /// In en, this message translates to:
  /// **'width'**
  String get width;

  /// No description provided for @height.
  ///
  /// In en, this message translates to:
  /// **'height'**
  String get height;

  /// No description provided for @clearscratch.
  ///
  /// In en, this message translates to:
  /// **'Would you like to clear all scratches?'**
  String get clearscratch;

  /// No description provided for @total_width.
  ///
  /// In en, this message translates to:
  /// **'total width'**
  String get total_width;

  /// No description provided for @total_height.
  ///
  /// In en, this message translates to:
  /// **'total height'**
  String get total_height;

  /// No description provided for @no_data.
  ///
  /// In en, this message translates to:
  /// **'There is no data.'**
  String get no_data;

  /// No description provided for @fill_your_profile.
  ///
  /// In en, this message translates to:
  /// **'Please fill in your profile information.'**
  String get fill_your_profile;

  /// No description provided for @fill_firstname.
  ///
  /// In en, this message translates to:
  /// **'Please fill your firstname'**
  String get fill_firstname;

  /// No description provided for @fill_lastname.
  ///
  /// In en, this message translates to:
  /// **'Please fill your lastname'**
  String get fill_lastname;

  /// No description provided for @fill_phone.
  ///
  /// In en, this message translates to:
  /// **'Please fill your phone number'**
  String get fill_phone;

  /// No description provided for @fill_email.
  ///
  /// In en, this message translates to:
  /// **'Please fill your email'**
  String get fill_email;

  /// No description provided for @fill_address_in_profile.
  ///
  /// In en, this message translates to:
  /// **'Please fill your email'**
  String get fill_address_in_profile;

  /// No description provided for @fill_dob.
  ///
  /// In en, this message translates to:
  /// **'Please fill your day of birth'**
  String get fill_dob;

  /// No description provided for @fill_selfintro.
  ///
  /// In en, this message translates to:
  /// **'Please fill your selfIntro'**
  String get fill_selfintro;

  /// No description provided for @fill_prefecture.
  ///
  /// In en, this message translates to:
  /// **'Please fill your prefecture'**
  String get fill_prefecture;

  /// No description provided for @do_u_wanna_delete_items.
  ///
  /// In en, this message translates to:
  /// **'Do you want to delete items?'**
  String get do_u_wanna_delete_items;

  /// No description provided for @inquiry.
  ///
  /// In en, this message translates to:
  /// **'Inquiry'**
  String get inquiry;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @draft_deleted.
  ///
  /// In en, this message translates to:
  /// **'Draft deleted.'**
  String get draft_deleted;

  /// No description provided for @wanna_delete_draft.
  ///
  /// In en, this message translates to:
  /// **'Would you like to delete the draft?'**
  String get wanna_delete_draft;

  /// No description provided for @wanna_delete_scratch.
  ///
  /// In en, this message translates to:
  /// **'Would you like to delete the scratch?'**
  String get wanna_delete_scratch;

  /// No description provided for @idk.
  ///
  /// In en, this message translates to:
  /// **'I do not know.'**
  String get idk;

  /// No description provided for @item.
  ///
  /// In en, this message translates to:
  /// **'item'**
  String get item;

  /// No description provided for @items.
  ///
  /// In en, this message translates to:
  /// **'items'**
  String get items;

  /// No description provided for @please_choose_company.
  ///
  /// In en, this message translates to:
  /// **'Please choose company'**
  String get please_choose_company;

  /// No description provided for @ask_specific_company.
  ///
  /// In en, this message translates to:
  /// **'Ask a specific company'**
  String get ask_specific_company;

  /// No description provided for @select_company_info.
  ///
  /// In en, this message translates to:
  /// **'Select company information'**
  String get select_company_info;

  /// No description provided for @enter_company_code.
  ///
  /// In en, this message translates to:
  /// **'Please enter the company code'**
  String get enter_company_code;

  /// No description provided for @choice.
  ///
  /// In en, this message translates to:
  /// **'Choice'**
  String get choice;

  /// No description provided for @corp_info.
  ///
  /// In en, this message translates to:
  /// **'Corporate information'**
  String get corp_info;

  /// No description provided for @company.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get company;

  /// No description provided for @please_fill_email.
  ///
  /// In en, this message translates to:
  /// **'Please fill email address'**
  String get please_fill_email;

  /// No description provided for @please_fill_password.
  ///
  /// In en, this message translates to:
  /// **'Please fill password'**
  String get please_fill_password;

  /// No description provided for @please_input_new_password.
  ///
  /// In en, this message translates to:
  /// **'Please input new password'**
  String get please_input_new_password;

  /// No description provided for @please_repeat_new_password.
  ///
  /// In en, this message translates to:
  /// **'Please repeat new password'**
  String get please_repeat_new_password;

  /// No description provided for @please_input_reset_code.
  ///
  /// In en, this message translates to:
  /// **'Please input reset code'**
  String get please_input_reset_code;

  /// No description provided for @password_successfully_reset.
  ///
  /// In en, this message translates to:
  /// **'Your password has been successfully reset'**
  String get password_successfully_reset;

  /// No description provided for @please_input_confirmation_code.
  ///
  /// In en, this message translates to:
  /// **'Please input confirmation code'**
  String get please_input_confirmation_code;

  /// No description provided for @please_read_terms.
  ///
  /// In en, this message translates to:
  /// **'Please read terms and conditions'**
  String get please_read_terms;

  /// No description provided for @successfully_registered.
  ///
  /// In en, this message translates to:
  /// **'Successfully registered'**
  String get successfully_registered;

  /// No description provided for @please_input_inquiry.
  ///
  /// In en, this message translates to:
  /// **'Please input inquiry'**
  String get please_input_inquiry;

  /// No description provided for @please_select_occupation.
  ///
  /// In en, this message translates to:
  /// **'Please select occupation'**
  String get please_select_occupation;

  /// No description provided for @please_input_experience.
  ///
  /// In en, this message translates to:
  /// **'Please input experience'**
  String get please_input_experience;

  /// No description provided for @please_choose_category.
  ///
  /// In en, this message translates to:
  /// **'Please choose category'**
  String get please_choose_category;

  /// No description provided for @please_choose_skill.
  ///
  /// In en, this message translates to:
  /// **'Please choose skill'**
  String get please_choose_skill;

  /// No description provided for @please_input_firstname.
  ///
  /// In en, this message translates to:
  /// **'Please input first name'**
  String get please_input_firstname;

  /// No description provided for @please_input_lastname.
  ///
  /// In en, this message translates to:
  /// **'Please input last name'**
  String get please_input_lastname;

  /// No description provided for @please_select_dob.
  ///
  /// In en, this message translates to:
  /// **'Please select date of birth'**
  String get please_select_dob;

  /// No description provided for @please_input_postal_code.
  ///
  /// In en, this message translates to:
  /// **'Please input postal code'**
  String get please_input_postal_code;

  /// No description provided for @please_select_prefecture.
  ///
  /// In en, this message translates to:
  /// **'Please select prefecture'**
  String get please_select_prefecture;

  /// No description provided for @please_input_address.
  ///
  /// In en, this message translates to:
  /// **'Please input address'**
  String get please_input_address;

  /// No description provided for @please_input_phone.
  ///
  /// In en, this message translates to:
  /// **'Please input phone number'**
  String get please_input_phone;

  /// No description provided for @please_input_self_intro.
  ///
  /// In en, this message translates to:
  /// **'Please input self intro'**
  String get please_input_self_intro;

  /// No description provided for @please_fill_current_password.
  ///
  /// In en, this message translates to:
  /// **'Please fill current password'**
  String get please_fill_current_password;

  /// No description provided for @updating.
  ///
  /// In en, this message translates to:
  /// **'Updating fields...'**
  String get updating;

  /// No description provided for @updated.
  ///
  /// In en, this message translates to:
  /// **'Work is updated.'**
  String get updated;

  /// No description provided for @terms_text.
  ///
  /// In en, this message translates to:
  /// **'Terms of service'**
  String get terms_text;

  /// No description provided for @privacy_text.
  ///
  /// In en, this message translates to:
  /// **'Privacy policy'**
  String get privacy_text;

  /// No description provided for @wall.
  ///
  /// In en, this message translates to:
  /// **'Wall'**
  String get wall;

  /// No description provided for @consultation.
  ///
  /// In en, this message translates to:
  /// **'Consultation'**
  String get consultation;

  /// No description provided for @quotes_reports.
  ///
  /// In en, this message translates to:
  /// **'Quotes & Reports'**
  String get quotes_reports;

  /// No description provided for @fill_details.
  ///
  /// In en, this message translates to:
  /// **'お問い合せ・相談内容をご記入ください。'**
  String get fill_details;

  /// No description provided for @profile_settings.
  ///
  /// In en, this message translates to:
  /// **'Profile settings'**
  String get profile_settings;

  /// No description provided for @innoichi_camera.
  ///
  /// In en, this message translates to:
  /// **'Use INNOICHI Camera'**
  String get innoichi_camera;

  /// No description provided for @wanna_download_photo.
  ///
  /// In en, this message translates to:
  /// **'Would you like to download this photo?'**
  String get wanna_download_photo;

  /// No description provided for @open_to_the_public.
  ///
  /// In en, this message translates to:
  /// **'Open to the public'**
  String get open_to_the_public;

  /// No description provided for @you_cant_send_link.
  ///
  /// In en, this message translates to:
  /// **'You can not send any links.'**
  String get you_cant_send_link;

  /// No description provided for @delete_account.
  ///
  /// In en, this message translates to:
  /// **'Delete account'**
  String get delete_account;

  /// No description provided for @delete_account_warning.
  ///
  /// In en, this message translates to:
  /// **'If you delete an account\n the information you have registered will be deleted\n so please be careful.'**
  String get delete_account_warning;

  /// No description provided for @delete_account_confirm.
  ///
  /// In en, this message translates to:
  /// **'Please delete your account if you understand the above'**
  String get delete_account_confirm;

  /// No description provided for @the_transmission_of_the_new_task_to_company.
  ///
  /// In en, this message translates to:
  /// **'Request a quote'**
  String get the_transmission_of_the_new_task_to_company;

  /// No description provided for @shotDifferentPlace.
  ///
  /// In en, this message translates to:
  /// **'Take photos in another place'**
  String get shotDifferentPlace;

  /// No description provided for @delete_account_success.
  ///
  /// In en, this message translates to:
  /// **'Your account has been successfully deleted.'**
  String get delete_account_success;

  /// No description provided for @email_empty_error.
  ///
  /// In en, this message translates to:
  /// **'Email cannot be empty.'**
  String get email_empty_error;

  /// No description provided for @email_invalid_error.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email address.'**
  String get email_invalid_error;

  /// No description provided for @password_empty_error.
  ///
  /// In en, this message translates to:
  /// **'Password cannot be empty.'**
  String get password_empty_error;

  /// No description provided for @password_length_error.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters long.'**
  String get password_length_error;

  /// No description provided for @transfer_info.
  ///
  /// In en, this message translates to:
  /// **'Transfer information'**
  String get transfer_info;

  /// No description provided for @cancel_case.
  ///
  /// In en, this message translates to:
  /// **'Cancel case'**
  String get cancel_case;

  /// No description provided for @size_measurement.
  ///
  /// In en, this message translates to:
  /// **'Size measurement'**
  String get size_measurement;

  /// No description provided for @new_project.
  ///
  /// In en, this message translates to:
  /// **'New project'**
  String get new_project;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'mn'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'mn':
      return AppLocalizationsMn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
